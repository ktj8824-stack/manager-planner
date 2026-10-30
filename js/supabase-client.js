/* ==============================================================================
   🏢 Supabase Client & Realtime Sync Module for Manager Planner
   ============================================================================== */

const SupabaseClient = {
  client: null,
  isConfigured: false,
  currentUser: null,
  currentProfile: null,
  realtimeChannel: null,

  STORAGE_KEY_URL: 'BP_SUPABASE_URL',
  STORAGE_KEY_ANON_KEY: 'BP_SUPABASE_ANON_KEY',

  // 기본 Supabase 연결 정보 (하드코딩)
  DEFAULT_URL: 'https://gohxflsyhogyxantnlig.supabase.co',
  DEFAULT_KEY: 'sb_publishable_4BiVB8PhD5kk1Dvtvf6Hkw_8YZL0Mwa',

  // 1. 초기화
  init() {
    const url = localStorage.getItem(this.STORAGE_KEY_URL) || this.DEFAULT_URL;
    // 예전(legacy JWT) 키가 브라우저에 저장돼 있으면 폐기하고 기본(publishable) 키를 사용합니다.
    const storedKey = localStorage.getItem(this.STORAGE_KEY_ANON_KEY);
    if (storedKey && storedKey.startsWith('eyJ')) {
      localStorage.removeItem(this.STORAGE_KEY_ANON_KEY);
    }
    const key = localStorage.getItem(this.STORAGE_KEY_ANON_KEY) || this.DEFAULT_KEY;

    if (url && key && typeof supabase !== 'undefined') {
      try {
        this.client = supabase.createClient(url, key);
        this.isConfigured = true;
        console.log('✅ Supabase 클라이언트가 정상적으로 초기화되었습니다.');
      } catch (err) {
        console.error('❌ Supabase 초기화 오류:', err);
        this.isConfigured = false;
      }
    } else {
      console.log('ℹ️ Supabase 키가 설정되지 않아 로컬/데모 모드로 동작합니다.');
      this.isConfigured = false;
    }
  },

  // 설정 저장 및 재초기화
  setConfig(url, anonKey) {
    if (!url || !anonKey) {
      throw new Error('Supabase URL과 Anon Key를 모두 입력해주세요.');
    }
    localStorage.setItem(this.STORAGE_KEY_URL, url.trim());
    localStorage.setItem(this.STORAGE_KEY_ANON_KEY, anonKey.trim());
    this.init();
    return this.isConfigured;
  },

  clearConfig() {
    localStorage.removeItem(this.STORAGE_KEY_URL);
    localStorage.removeItem(this.STORAGE_KEY_ANON_KEY);
    this.client = null;
    this.isConfigured = false;
  },

  getConfig() {
    return {
      url: localStorage.getItem(this.STORAGE_KEY_URL) || '',
      anonKey: localStorage.getItem(this.STORAGE_KEY_ANON_KEY) || '',
      isConfigured: this.isConfigured
    };
  },

  // ── 2. 인증 (Authentication) ──

  // Privileged account operations run only in a JWT-validated Edge Function.
  async invokeUserManagement(body) {
    const session = await this.getCurrentSession();
    if (!session || !['ceo', 'hq_admin'].includes(session.profile?.role)) {
      throw new Error('본사 관리자 인증이 필요합니다.');
    }
    const { data, error } = await this.client.functions.invoke('manage-users', { body });
    if (error) {
      // 서버가 돌려준 실제 원인(상태 코드/메시지)을 화면에 보여준다
      let detail = '';
      try {
        const res = error.context;
        if (res && typeof res.json === 'function') {
          const j = await res.clone().json();
          detail = (j?.error?.message || (typeof j?.error === 'string' ? j.error : '') || j?.message || '') + (j?.error?.code ? ' [' + j.error.code + ']' : '');
          detail = (res.status ? 'HTTP ' + res.status + ' ' : '') + detail;
        } else if (res?.status) {
          detail = 'HTTP ' + res.status;
        }
      } catch (e) { }
      if (/SLOT_LIMIT/.test(detail)) throw new Error('매니저 슬롯이 모두 사용 중입니다. 슬롯을 추가한 뒤 등록해 주세요.');
      throw new Error('계정 관리 서버 요청에 실패했습니다.' + (detail ? ' (' + detail.trim() + ')' : ' (서버에 연결하지 못했습니다)'));
    }
    if (!data || data.error) throw new Error(data?.error?.message || (typeof data?.error === 'string' ? data.error : '계정 관리 서버 응답이 올바르지 않습니다.'));
    return data;
  },

  async adminCreateUser(email, password, name, role = 'manager', phone = '') {
    if (!['manager', 'staff'].includes(role)) throw new Error('관리자 권한 부여는 신뢰할 수 있는 서버에서만 가능합니다.');
    return this.invokeUserManagement({ action: 'create', email: email.trim(), password, name, role, phone });
  },

  async adminUpdateUser(id, data = {}) {
    return this.invokeUserManagement({ action: 'update', id, data });
  },

  async signUp(email, password, name, role = 'manager', phone = '') {
    return this.adminCreateUser(email, password, name, role, phone);
  },

  async signIn(email, password) {
    if (!this.isConfigured) throw new Error('Supabase 설정이 필요합니다.');

    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    this.currentUser = data.user;
    await this.fetchProfile();
    return { user: data.user, profile: this.currentProfile };
  },

  async signOut() {
    if (this.isConfigured && this.client) {
      await this.client.auth.signOut();
    }
    this.currentUser = null;
    this.currentProfile = null;
    localStorage.removeItem('bp_logged_in');
    localStorage.removeItem('bp_user_email');
    localStorage.removeItem('bp_user_name');
    localStorage.removeItem('bp_user_role');
    for (const key of ['bp_manager_id', 'bp_manager_filter', 'bp_assigned_artists', 'bp_onboarded', 'admin_bp_logged_in', 'admin_bp_user_role']) localStorage.removeItem(key);
  },

  async getCurrentSession() {
    if (!this.isConfigured) return null;
    const { data, error } = await this.client.auth.getSession();
    if (error) throw error;
    if (data?.session) {
      const verified = await this.client.auth.getUser();
      if (verified.error || !verified.data?.user) throw new Error('로그인 세션이 유효하지 않습니다.');
      data.session.user = verified.data.user;
    }
    if (data && data.session) {
      this.currentUser = data.session.user;
      await this.fetchProfile();
      return { user: this.currentUser, profile: this.currentProfile };
    }
    return null;
  },

  async fetchProfile() {
    this.currentProfile = null;
    if (!this.isConfigured || !this.currentUser) return null;

    let profileData = null;
    try {
      const { data, error } = await this.client.from('profiles')
        .select('*, companies(name)').eq('id', this.currentUser.id).single();
      if (!error && data && data.role) {
        profileData = data;
      }
    } catch (e) {
      console.warn('profiles 조회 예외:', e);
    }

    // 권한은 서버 profiles 표에 있는 값만 믿습니다.
    // (user_metadata 나 이메일 글자로 권한을 추측하지 않습니다. 가입자가 직접 정할 수 있는 값이기 때문입니다.)
    if (!profileData) {
      localStorage.removeItem('bp_user_role');
      throw new Error('계정 권한을 확인할 수 없습니다. 본사 관리자에게 문의해주세요.');
    }

    if (!profileData || !['ceo', 'hq_admin', 'manager', 'staff', 'indie_manager'].includes(profileData.role)) {
      localStorage.removeItem('bp_user_role');
      throw new Error('계정 권한을 확인할 수 없습니다. 본사 관리자에게 문의해주세요.');
    }

    this.currentProfile = profileData;
    localStorage.setItem('bp_user_role', profileData.role === 'indie_manager' ? 'manager' : profileData.role);
    localStorage.setItem('bp_user_name', profileData.name || this.currentUser.email || '');
    const companyName = profileData.companies?.name || profileData.company_name;
    if (companyName) {
      localStorage.setItem('bp_company_name', companyName);
      localStorage.setItem('admin_bp_company_name', companyName);
    }
    return profileData;
  },

  // ── 3. 소속 아티스트 API ──

  // ── 클라이언트 객체 ↔ DB 행 변환 (화면 전용 필드는 data(JSONB)에 보관) ──
  _artistToRow(a) {
    const { id, name, type, members, color, emoji, status, care_info, ...rest } = a || {};
    return {
      id, name: name || '', type: type || '기타',
      members: Number.isFinite(Number(members)) ? Number(members) : 1,
      color: color || '#ec4899', emoji: emoji || '✨', status: status || '활동중',
      care_info: care_info && typeof care_info === 'object' ? care_info : {},
      data: rest
    };
  },

  _rowToArtist(r) {
    const { data, ...cols } = r || {};
    return { ...(data || {}), ...cols };
  },

  _vehicleToRow(v) {
    const { id, name, type, seats, status, ...rest } = v || {};
    return {
      id, name: name || '', type: type || '밴',
      capacity: Number(seats) || 7, status: status || '운행가능', data: rest
    };
  },

  _rowToVehicle(r) {
    const { data, capacity, ...cols } = r || {};
    return { ...(data || {}), ...cols, seats: capacity };
  },


  async getArtists() {
    if (!this.isConfigured) {
      return JSON.parse(localStorage.getItem('HQ_ARTISTS_V1') || '[]');
    }
    const { data, error } = await this.client
      .from('artists')
      .select('*')
      .order('name');
    if (error) throw error;
    return (data || []).map(r => this._rowToArtist(r));
  },

  async createArtist(artist) {
    if (!this.isConfigured) {
      const list = JSON.parse(localStorage.getItem('HQ_ARTISTS_V1') || '[]');
      list.push(artist);
      localStorage.setItem('HQ_ARTISTS_V1', JSON.stringify(list));
      return artist;
    }
    const { data, error } = await this.client
      .from('artists')
      .upsert([this._artistToRow(artist)], { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return this._rowToArtist(data);
  },

  async updateArtistCareInfo(id, careInfo) {
    if (!this.isConfigured) {
      const list = JSON.parse(localStorage.getItem('HQ_ARTISTS_V1') || '[]');
      const idx = list.findIndex(a => a.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], careInfo: careInfo };
        localStorage.setItem('HQ_ARTISTS_V1', JSON.stringify(list));
        return list[idx];
      }
      return null;
    }

    const { data, error } = await this.client
      .from('artists')
      .update({ care_info: careInfo })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateArtist(id, artist) {
    if (!this.isConfigured) {
      const list = JSON.parse(localStorage.getItem('HQ_ARTISTS_V1') || '[]');
      const idx = list.findIndex(a => a.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...artist };
        localStorage.setItem('HQ_ARTISTS_V1', JSON.stringify(list));
        return list[idx];
      }
      return null;
    }

    // 부분 수정도 전체 객체로 저장되도록 upsert 사용
    const { data, error } = await this.client
      .from('artists')
      .upsert([this._artistToRow({ ...artist, id })], { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return this._rowToArtist(data);
  },

  async deleteArtist(id) {
    if (!this.isConfigured) {
      let list = JSON.parse(localStorage.getItem('HQ_ARTISTS_V1') || '[]');
      list = list.filter(a => a.id !== id);
      localStorage.setItem('HQ_ARTISTS_V1', JSON.stringify(list));
      return true;
    }

    const { error } = await this.client
      .from('artists')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // ── 4. 매니저 목록 및 배정 API ──

  async getManagers() {
    if (!this.isConfigured) {
      return JSON.parse(localStorage.getItem('HQ_MANAGERS_V1') || '[]');
    }
    const { data, error } = await this.client
      .from('profiles')
      .select('*, artist_managers(artist_id)')
      .order('name');
    if (error) throw error;
    return data;
  },

  async assignManagerToArtist(artistId, managerId) {
    if (!this.isConfigured) return true;
    const { data, error } = await this.client
      .from('artist_managers')
      .upsert({ artist_id: artistId, manager_id: managerId }, { onConflict: 'artist_id,manager_id' });
    if (error) throw error;
    return data;
  },

  async unassignManagerFromArtist(artistId, managerId) {
    if (!this.isConfigured) return true;
    const { error } = await this.client
      .from('artist_managers')
      .delete()
      .eq('artist_id', artistId)
      .eq('manager_id', managerId);
    if (error) throw error;
    return true;
  },

  // ── 5. 차량 목록 API ──

  async getVehicles() {
    if (!this.isConfigured) {
      return JSON.parse(localStorage.getItem('HQ_VEHICLES_V1') || '[]');
    }
    const { data, error } = await this.client
      .from('vehicles')
      .select('*')
      .order('name');
    if (error) throw error;
    return (data || []).map(r => this._rowToVehicle(r));
  },

  async saveVehicle(vehicle) {
    if (!this.isConfigured) return vehicle;
    const { data, error } = await this.client
      .from('vehicles')
      .upsert([this._vehicleToRow(vehicle)], { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return this._rowToVehicle(data);
  },

  async deleteVehicle(id) {
    if (!this.isConfigured) return true;
    const { error } = await this.client.from('vehicles').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // ── 6. 통합 스케줄 API ──

  async getSchedules(filter = {}) {
    if (!this.isConfigured) {
      return JSON.parse(localStorage.getItem('HQ_SCHEDULES_V1') || '[]');
    }

    let query = this.client
      .from('schedules')
      .select('*, artists(*), profiles!schedules_manager_id_fkey(name, phone, role), vehicles(*)');

    if (filter.artistId && filter.artistId !== 'all') {
      query = query.eq('artist_id', filter.artistId);
    }
    if (filter.managerId && filter.managerId !== 'all') {
      query = query.eq('manager_id', filter.managerId);
    }
    if (filter.date) {
      query = query.eq('date', filter.date);
    }
    if (filter.startDate && filter.endDate) {
      query = query.gte('date', filter.startDate).lte('date', filter.endDate);
    }

    query = query.order('date', { ascending: true }).order('start_time', { ascending: true });

    const { data, error } = await query;
    if (error) {
      // 외래키 릴레이션 실패 시 기본 셀렉트 폴백
      const fallback = await this.client.from('schedules').select('*');
      if (fallback.error) throw fallback.error;
      return fallback.data;
    }
    return data;
  },

  async createSchedule(schedule) {
    if (!this.isConfigured) {
      const list = JSON.parse(localStorage.getItem('HQ_SCHEDULES_V1') || '[]');
      const newSch = { ...schedule, id: schedule.id || 'sch_' + Date.now() };
      list.push(newSch);
      localStorage.setItem('HQ_SCHEDULES_V1', JSON.stringify(list));
      return newSch;
    }

    const { data, error } = await this.client
      .from('schedules')
      .insert([schedule])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSchedule(id, updates) {
    if (!this.isConfigured) {
      const list = JSON.parse(localStorage.getItem('HQ_SCHEDULES_V1') || '[]');
      const idx = list.findIndex(s => s.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
        localStorage.setItem('HQ_SCHEDULES_V1', JSON.stringify(list));
        return list[idx];
      }
      return null;
    }

    const { data, error } = await this.client
      .from('schedules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSchedule(id) {
    if (!this.isConfigured) {
      let list = JSON.parse(localStorage.getItem('HQ_SCHEDULES_V1') || '[]');
      list = list.filter(s => s.id !== id);
      localStorage.setItem('HQ_SCHEDULES_V1', JSON.stringify(list));
      return true;
    }

    const { error } = await this.client
      .from('schedules')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // ── 7. 본사 긴급 공지 API (Announcements) ──

  async createAnnouncement(announcement) {
    if (!this.isConfigured) {
      const history = JSON.parse(localStorage.getItem('HQ_ANNOUNCEMENT_HISTORY') || '[]');
      const newNoti = {
        id: 'noti_' + Date.now(),
        title: announcement.title || '본사 공지사항',
        content: announcement.content || '',
        is_urgent: announcement.is_urgent || false,
        target_role: announcement.target_role || 'all',
        sender_name: announcement.sender_name || '본사 관제팀',
        created_at: new Date().toISOString()
      };
      history.unshift(newNoti);
      localStorage.setItem('HQ_ANNOUNCEMENT_HISTORY', JSON.stringify(history.slice(0, 50)));
      return newNoti;
    }

    const row = {
      title: announcement.title || '본사 공지사항',
      content: announcement.content,
      is_urgent: !!announcement.is_urgent,
      target_role: announcement.target_role || 'all',
      target_manager_id: announcement.target_manager_id || null,
      sender_name: announcement.sender_name || '본사 관제팀'
    };
    if (announcement.id) row.id = announcement.id;
    if (announcement.created_at) row.created_at = announcement.created_at;
    const { data, error } = await this.client
      .from('announcements')
      .insert([row])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getAnnouncements(limit = 20) {
    if (!this.isConfigured) {
      return JSON.parse(localStorage.getItem('HQ_ANNOUNCEMENT_HISTORY') || '[]');
    }

    try {
      const { data, error } = await this.client
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('getAnnouncements exception, fallback to local:', e);
      return JSON.parse(localStorage.getItem('HQ_ANNOUNCEMENT_HISTORY') || '[]');
    }
  },

  // ── 9. 대화창 (대표↔매니저 1:1 + 전체방, 사진 전송) ──

  _chatReady() {
    if (!this.isConfigured || !this.client || !this.currentUser?.id) throw new Error('서버에 연결되어 로그인해야 대화를 사용할 수 있습니다.');
  },

  async chatRooms() {
    this._chatReady();
    const { data, error } = await this.client.from('chat_rooms')
      .select('*, manager:manager_id(id, name, email, role)')
      .order('last_message_at', { ascending: false, nullsFirst: false });
    if (error) throw error;
    return data || [];
  },

  // 대화방 찾기, 없으면 만들기 (본사: 전체방/매니저별 1:1, 매니저: 내 1:1)
  async chatEnsureRoom(kind, managerId = null) {
    this._chatReady();
    const find = async () => {
      let q = this.client.from('chat_rooms').select('*, manager:manager_id(id, name, email, role)').eq('kind', kind);
      q = kind === 'direct' ? q.eq('manager_id', managerId) : q.is('manager_id', null);
      const { data, error } = await q.limit(1);
      if (error) throw error;
      return data?.[0] || null;
    };
    const found = await find();
    if (found) return found;
    const companyId = this.currentProfile?.company_id;
    if (!companyId) throw new Error('회사 정보가 없는 계정은 대화를 사용할 수 없습니다.');
    const row = { company_id: companyId, kind };
    if (kind === 'direct') row.manager_id = managerId;
    const { error } = await this.client.from('chat_rooms').insert([row]);
    if (error && error.code !== '23505') throw error;
    const created = await find();
    if (!created) throw new Error('대화방을 만들지 못했습니다.');
    return created;
  },

  async chatMessages(roomId, { before = null, limit = 40 } = {}) {
    this._chatReady();
    let q = this.client.from('chat_messages').select('*').eq('room_id', roomId)
      .order('created_at', { ascending: false }).limit(limit);
    if (before) q = q.lt('created_at', before);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).reverse();
  },

  async chatMessagesAfter(roomId, after) {
    this._chatReady();
    const { data, error } = await this.client.from('chat_messages').select('*').eq('room_id', roomId)
      .gt('created_at', after).order('created_at', { ascending: true }).limit(100);
    if (error) throw error;
    return data || [];
  },

  // 글/사진 보내기. imageBlob 은 화면에서 줄여 둔 jpeg
  async chatSend(roomId, { body = '', imageBlob = null, isUrgent = false } = {}) {
    this._chatReady();
    let imagePath = null;
    if (imageBlob) {
      const id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
      imagePath = roomId + '/' + id + '.jpg';
      const up = await this.client.storage.from('chat-images').upload(imagePath, imageBlob, { contentType: 'image/jpeg', upsert: false });
      if (up.error) throw up.error;
    }
    const { data, error } = await this.client.from('chat_messages')
      .insert([{ room_id: roomId, body, image_path: imagePath, is_urgent: !!isUrgent }])
      .select().single();
    if (error) throw error;
    return data;
  },

  async chatImageUrls(paths) {
    this._chatReady();
    this._chatUrlCache = this._chatUrlCache || new Map();
    const need = [...new Set(paths)].filter(p => p && !(this._chatUrlCache.get(p)?.exp > Date.now()));
    if (need.length) {
      const { data, error } = await this.client.storage.from('chat-images').createSignedUrls(need, 3600);
      if (error) throw error;
      (data || []).forEach(item => { if (item.signedUrl) this._chatUrlCache.set(item.path, { url: item.signedUrl, exp: Date.now() + 3000 * 1000 }); });
    }
    const out = {};
    paths.forEach(p => { out[p] = this._chatUrlCache.get(p)?.url || ''; });
    return out;
  },

  async chatMarkRead(roomId) {
    this._chatReady();
    const { error } = await this.client.from('chat_reads')
      .upsert({ room_id: roomId, user_id: this.currentUser.id, last_read_at: new Date().toISOString() }, { onConflict: 'room_id,user_id' });
    if (error) throw error;
  },

  // 상대방이 어디까지 읽었는지 (supabase_chat_upgrade.sql 필요. 없으면 빈 목록)
  async chatReadStatus(roomId) {
    this._chatReady();
    const { data, error } = await this.client.rpc('chat_read_status', { p_room: roomId });
    if (error) { if (/chat_read_status/.test(error.message || '')) return null; throw error; }
    return data || [];
  },

  // 대화 내용 검색 (내가 볼 수 있는 방에서만)
  async chatSearch(q, limit = 30) {
    this._chatReady();
    const safe = String(q || '').replace(/[%_\\]/g, ' ').trim().slice(0, 60);
    if (safe.length < 2) return [];
    const { data, error } = await this.client.from('chat_messages').select('id, room_id, sender_name, body, created_at')
      .ilike('body', '%' + safe + '%').order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return data || [];
  },

  async chatUnread() {
    this._chatReady();
    const { data, error } = await this.client.rpc('chat_unread_counts');
    if (error) throw error;
    const map = {};
    (data || []).forEach(r => { map[r.room_id] = Number(r.unread) || 0; });
    return map;
  },

  chatSubscribe(onInsert) {
    if (!this.isConfigured || !this.client) return null;
    if (this._chatChannel) { try { this.client.removeChannel(this._chatChannel); } catch (e) { } }
    this._chatChannel = this.client.channel('public:chat_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => { if (payload?.new && typeof onInsert === 'function') onInsert(payload.new); })
      .subscribe();
    return this._chatChannel;
  },

  // ── 8. 실시간 동기화 (Realtime Subscriptions) ──

  subscribeToSchedules(onUpdate) {
    if (!this.isConfigured || !this.client) return null;

    if (this.realtimeChannel) {
      try { this.client.removeChannel(this.realtimeChannel); } catch (e) {}
    }

    this.realtimeChannel = this.client
      .channel('public:schedules')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'schedules' },
        (payload) => {
          console.log('⚡ [Realtime] 스케줄 변경 감지:', payload);
          // 🔒 ceo@kjm-ent.com 테스트 계정은 로컬 데이터 보호를 위해 실시간 외부 갱신 건너뜀
          const rawEmail = (localStorage.getItem('admin_bp_user_email') || localStorage.getItem('bp_user_email') || SupabaseClient?.currentUser?.email || '').trim().toLowerCase();
          if (rawEmail === 'ceo@kjm-ent.com' || rawEmail === 'ceo@jm-ent.com') {
            return;
          }
          if (typeof onUpdate === 'function') {
            onUpdate(payload);
          }
        }
      )
      .subscribe((status) => {
        console.log('⚡ [Realtime] 스케줄 구독 상태:', status);
      });

    return this.realtimeChannel;
  },

  subscribeToAnnouncements(onNewAnnouncement) {
    if (!this.isConfigured || !this.client) return null;

    const notiChannel = this.client
      .channel('public:announcements')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'announcements' },
        (payload) => {
          console.log('🚨 [Realtime] 신규 본사 공지 수신:', payload);
          if (payload && payload.new && typeof onNewAnnouncement === 'function') {
            onNewAnnouncement({
              id: payload.new.id,
              title: payload.new.title,
              content: payload.new.content,
              isUrgent: payload.new.is_urgent,
              sender: payload.new.sender_name,
              createdAt: payload.new.created_at
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('📢 [Realtime] 공지사항 구독 상태:', status);
      });

    return notiChannel;
  },

  subscribeAll(callbacks = {}) {
    if (!this.isConfigured || !this.client) return;

    if (callbacks.onScheduleChange) {
      this.subscribeToSchedules(callbacks.onScheduleChange);
    }
    if (callbacks.onAnnouncement) {
      this.subscribeToAnnouncements(callbacks.onAnnouncement);
    }
  }
};

// 전역 초기화 실행
if (typeof window !== 'undefined') {
  window.SupabaseClient = SupabaseClient;
  document.addEventListener('DOMContentLoaded', () => {
    SupabaseClient.init();
  });
}
