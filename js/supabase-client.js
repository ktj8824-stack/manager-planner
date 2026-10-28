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
    if (error) throw new Error('계정 관리 서버 요청에 실패했습니다. manage-users 함수 배포와 이메일 인증 설정을 확인해주세요.');
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

    // DB profiles가 없거나 조회가 실패했을 때 user_metadata 폴백 (정상 인증된 사용자)
    if (!profileData) {
      const meta = this.currentUser.user_metadata || {};
      const fallbackRole = meta.role || (this.currentUser.email?.toLowerCase().includes('ceo') ? 'ceo' : 'manager');
      const companyName = meta.company_name || localStorage.getItem('reg_company_name') || localStorage.getItem('admin_bp_company_name') || 'KJM 엔터테인먼트';
      profileData = {
        id: this.currentUser.id,
        email: this.currentUser.email,
        name: meta.name || this.currentUser.email?.split('@')[0] || '관리자',
        role: fallbackRole,
        phone: meta.phone || '',
        company_name: companyName,
        companies: { name: companyName }
      };
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

  async getArtists() {
    if (!this.isConfigured) {
      return JSON.parse(localStorage.getItem('HQ_ARTISTS_V1') || '[]');
    }
    const { data, error } = await this.client
      .from('artists')
      .select('*')
      .order('name');
    if (error) throw error;
    return data;
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
      .insert([artist])
      .select()
      .single();
    if (error) throw error;
    return data;
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

    const { data, error } = await this.client
      .from('artists')
      .update(artist)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
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
    return data;
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

    try {
      const { data, error } = await this.client
        .from('announcements')
        .insert([{
          title: announcement.title || '본사 공지사항',
          content: announcement.content,
          is_urgent: !!announcement.is_urgent,
          target_role: announcement.target_role || 'all',
          sender_name: announcement.sender_name || '본사 관제팀'
        }])
        .select()
        .single();

      if (error) {
        console.warn('Supabase createAnnouncement error:', error);
        return null;
      }
      return data;
    } catch (e) {
      console.warn('createAnnouncement exception:', e);
      return null;
    }
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
