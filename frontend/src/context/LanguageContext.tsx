import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}

export const translations: Translations = {
  // App Title & Tagline
  app_title: {
    en: 'COMPETITION CONTROL CENTER',
    ar: 'مركز التحكم في المنافسات',
  },
  app_tagline: {
    en: 'Real-Time Tournament Management System',
    ar: 'منظومة إدارة البطولات والمنافسات الحية',
  },
  // Navigation / Views
  view_admin: {
    en: 'Control Room',
    ar: 'غرفة التحكم (المسؤول)',
  },
  view_operator: {
    en: 'Operator Dashboard',
    ar: 'لوحة المشغل',
  },
  view_public: {
    en: 'Public Arena Screen',
    ar: 'شاشة العرض العامة (TV)',
  },
  // Central Timer
  central_timer: {
    en: 'Central Round Timer',
    ar: 'المؤقت المركزي للجولة',
  },
  time_expired: {
    en: 'TIME EXPIRED',
    ar: 'انتهى الوقت',
  },
  awaiting_results: {
    en: 'Awaiting Results',
    ar: 'في انتظار النتائج',
  },
  round_active: {
    en: 'Round Active',
    ar: 'الجولة نشطة',
  },
  round_locked: {
    en: 'Round Locked',
    ar: 'الجولة مغلقة',
  },
  round_locked_desc: {
    en: 'This round cannot be played until all matches in the previous round are completed.',
    ar: 'لا يمكن لعب هذه الجولة أو اختيار أي فائز حتى تكتمل جميع مباريات الجولة السابقة.',
  },
  cannot_pick_winner_locked: {
    en: 'Round Locked: You cannot choose a winner until the previous round is completely played.',
    ar: 'الجولة مقفلة: لا يمكن اختيار فائز حتى يتم إنهاء جميع مباريات الجولة السابقة أولاً.',
  },
  cannot_start_locked_round: {
    en: 'Round Locked: Previous round must be completed before starting this round.',
    ar: 'الجولة مقفلة: يجب إنهاء واعتماد الجولة السابقة أولاً قبل بدء المؤقت.',
  },
  round_paused: {
    en: 'Timer Paused',
    ar: 'المؤقت متوقف مؤقتاً',
  },
  timer_idle: {
    en: 'Timer Ready',
    ar: 'المؤقت جاهز',
  },
  start_round: {
    en: 'START ROUND',
    ar: 'بدء الجولة',
  },
  pause_timer: {
    en: 'PAUSE',
    ar: 'إيقاف مؤقت',
  },
  resume_timer: {
    en: 'RESUME',
    ar: 'استئناف',
  },
  end_round_timer: {
    en: 'END ROUND',
    ar: 'إنهاء الجولة',
  },
  reset_timer: {
    en: 'RESET TIMER',
    ar: 'إعادة ضبط المؤقت',
  },
  set_duration: {
    en: 'Set Duration',
    ar: 'تحديد المدة',
  },
  duration_minutes: {
    en: 'Duration (Minutes)',
    ar: 'المدة (بالدقائق)',
  },
  // Station Readiness & Pre-Round Briefing
  station_ready: {
    en: 'Ready to Start',
    ar: 'جاهز للبدء',
  },
  station_explaining: {
    en: 'Rules Briefing',
    ar: 'جاري الشرح والاستعداد',
  },
  mark_as_ready: {
    en: 'I am Ready • جاهز للبدء',
    ar: 'جاهز للبدء (Ready)',
  },
  mark_as_not_ready: {
    en: 'Need More Time (Briefing)',
    ar: 'تعديل (جاري الشرح)',
  },
  stations_readiness: {
    en: 'Stations Readiness',
    ar: 'جاهزية المحطات',
  },
  all_stations_ready: {
    en: 'All stations are ready to start!',
    ar: 'جميع المحطات جاهزة للبدء!',
  },
  all_stations_ready_banner: {
    en: 'All 5 game stations confirmed ready! You can now start the round timer.',
    ar: 'جميع محطات الألعاب الـ 5 أعلنت جاهزيتها! يمكنك الآن بدء مؤقت الجولة.',
  },
  waiting_for_stations: {
    en: 'Waiting for game operators to finish briefing teams...',
    ar: 'في انتظار انتهاء المشرفين من شرح الألعاب وتأكيد الجاهزية...',
  },
  briefing_phase_title: {
    en: 'Game Briefing & Rules Explanation',
    ar: 'مرحلة شرح قواعد اللعبة والاستعداد',
  },
  briefing_phase_desc: {
    en: 'Explain the game rules and tactical instructions to both teams, ensure they are positioned, then click Ready.',
    ar: 'اشرح قواعد اللعبة والتعليمات للفريقين وتأكد من استعدادهما التام، ثم اضغط على زر جاهز لإبلاغ غرفة التحكم.',
  },
  ready_confirmed_title: {
    en: 'Station Ready Confirmed! ✅',
    ar: 'تم تأكيد الجاهزية بنجاح! ✅',
  },
  ready_confirmed_desc: {
    en: 'Control Room notified that this station is ready. Awaiting round timer start signal (10 minutes).',
    ar: 'تم إبلاغ غرفة التحكم بأن محطتك جاهزة لبدء الجولة. في انتظار إطلاق صفارة ومؤقت الـ 10 دقائق.',
  },
  round_in_progress_banner: {
    en: 'Round is currently active! 10-minute timer running.',
    ar: 'الجولة جارية الآن! المؤقت يعمل (10 دقائق) - بالتوفيق للفريقين.',
  },
  confirm_start_not_all_ready: {
    en: 'Some stations are still explaining rules and have not confirmed readiness yet. Start the round anyway?',
    ar: 'تنبيه: هناك محطات لم تؤكد جاهزيتها بعد (لا تزال في مرحلة الشرح). هل تريد بدء مؤقت الجولة على أي حال؟',
  },
  start_anyway: {
    en: 'Start Anyway',
    ar: 'بدء الجولة على أي حال',
  },
  wait_for_ready: {
    en: 'Wait for All Ready',
    ar: 'انتظار اكتمال الجاهزية',
  },
  // Tournament Stats
  stats_teams: {
    en: 'Total Teams',
    ar: 'إجمالي الفرق',
  },
  stats_games: {
    en: 'Game Stations',
    ar: 'محطات الألعاب',
  },
  stats_rounds: {
    en: 'Total Rounds',
    ar: 'إجمالي الجولات',
  },
  stats_current_round: {
    en: 'Current Round',
    ar: 'الجولة الحالية',
  },
  stats_completed: {
    en: 'Completed',
    ar: 'المكتملة',
  },
  stats_in_progress: {
    en: 'In Progress',
    ar: 'جارية الآن',
  },
  stats_pending: {
    en: 'Pending',
    ar: 'في الانتظار',
  },
  // Rounds
  round: {
    en: 'Round',
    ar: 'الجولة',
  },
  approve_round: {
    en: 'Approve & Complete Round',
    ar: 'اعتماد وإنهاء الجولة',
  },
  round_completed_success: {
    en: 'Round marked complete! Next round is now ready.',
    ar: 'تم اعتماد الجولة بنجاح! الجولة التالية جاهزة الآن.',
  },
  pending_matches_warning: {
    en: 'All 5 matches must have submitted results before completing the round.',
    ar: 'يجب تسجيل نتائج جميع المباريات الخمس قبل إنهاء الجولة.',
  },
  // Operator Match Results
  team_a_wins: {
    en: 'TEAM A WINS',
    ar: 'فوز الفريق الأول',
  },
  team_b_wins: {
    en: 'TEAM B WINS',
    ar: 'فوز الفريق الثاني',
  },
  draw: {
    en: 'DRAW',
    ar: 'تعادل',
  },
  submit_result_title: {
    en: 'Submit Official Result',
    ar: 'تسجيل النتيجة الرسمية',
  },
  confirm_result_desc: {
    en: 'Are you sure you want to submit this result? Once submitted, it cannot be modified by the operator.',
    ar: 'هل أنت متأكد من تسجيل هذه النتيجة؟ بعد التسجيل لا يمكن للمشغل تعديلها نهائياً.',
  },
  confirm_button: {
    en: 'Confirm & Broadcast',
    ar: 'تأكيد وبث النتيجة فوراً',
  },
  cancel: {
    en: 'Cancel',
    ar: 'إلغاء',
  },
  result_submitted_badge: {
    en: 'Result Officially Submitted',
    ar: 'تم تسجيل النتيجة رسمياً',
  },
  submitted_by: {
    en: 'Submitted By',
    ar: 'سُجلت بواسطة',
  },
  submitted_at: {
    en: 'Submission Time',
    ar: 'وقت التسجيل',
  },
  locked_operator_note: {
    en: 'Result is locked. Only the Main Administrator can correct this result.',
    ar: 'النتيجة مقفلة. فقط المسؤول الرئيسي يمكنه تعديلها.',
  },
  optional_notes: {
    en: 'Operator Notes (Optional)',
    ar: 'ملاحظات المشغل (اختياري)',
  },
  notes_placeholder: {
    en: 'Add referee notes or match observations...',
    ar: 'أضف ملاحظات الحكم أو ملابسات النتيجة...',
  },
  // Admin Corrections
  correct_result_btn: {
    en: 'Correct Result',
    ar: 'تعديل النتيجة (إداري)',
  },
  correct_modal_title: {
    en: 'Administrative Result Correction',
    ar: 'تعديل النتيجة من قبل المسؤول الرئيسي',
  },
  correction_reason: {
    en: 'Reason for Correction (Mandatory Audit)',
    ar: 'سبب التعديل (إلزامي للتوثيق والتدقيق)',
  },
  correction_reason_placeholder: {
    en: 'Specify video review, referee error, or rule clarification...',
    ar: 'اذكر سبب التعديل (مراجعة الفيديو، خطأ تحكيمي، قرار إداري)...',
  },
  corrected_badge: {
    en: 'Corrected by Admin',
    ar: 'معدلة إدارياً',
  },
  // Leaderboard
  leaderboard_title: {
    en: 'LIVE TOURNAMENT LEADERBOARD',
    ar: 'جدول الترتيب العام المباشر',
  },
  rank: {
    en: 'Rank',
    ar: 'الترتيب',
  },
  team: {
    en: 'Team',
    ar: 'الفريق',
  },
  points: {
    en: 'Points',
    ar: 'النقاط',
  },
  wins_short: {
    en: 'W',
    ar: 'فوز',
  },
  draws_short: {
    en: 'D',
    ar: 'تعادل',
  },
  losses_short: {
    en: 'L',
    ar: 'خسارة',
  },
  played_short: {
    en: 'P',
    ar: 'لعب',
  },
  remaining_short: {
    en: 'Rem',
    ar: 'متبقي',
  },
  scoring_rule_notice: {
    en: 'Official Scoring: Win = 3 Pts | Draw = 1 Pt | Loss = 0 Pt',
    ar: 'نظام النقاط الرسمي: الفوز = 3 نقاط | التعادل = 1 نقطة | الخسارة = 0 نقطة',
  },
  reset_tournament: {
    en: 'Reset Tournament',
    ar: 'تصفير البطولة بالكامل',
  },
  reset_confirm_title: {
    en: 'Restart Entire Tournament?',
    ar: 'تصفير وإعادة تعيين البطولة من البداية؟',
  },
  reset_confirm_desc: {
    en: 'This will wipe all 25 match results, reset the leaderboard and timer, and return to Round 1.',
    ar: 'سيتم مسح جميع نتائج الجولات (25 مباراة)، وتصفير جدول الترتيب والنقاط والمؤقت والبدء من الجولة 1.',
  },
  adjust_points_btn: {
    en: 'Adjust Points',
    ar: 'إضافة / خصم نقاط',
  },
  adjust_points_title: {
    en: 'Manual Points Adjustment',
    ar: 'إضافة / خصم نقاط لفريق',
  },
  // Audit Log & Activity
  audit_feed: {
    en: 'Live Activity Audit Log',
    ar: 'سجل العمليات والتدقيق الحي',
  },
  // Authentication & Demo
  login: {
    en: 'Sign In',
    ar: 'تسجيل الدخول',
  },
  logout: {
    en: 'Sign Out',
    ar: 'تسجيل الخروج',
  },
  quick_switch: {
    en: 'Switch Role (Demo)',
    ar: 'تبديل الحساب (تجريبي)',
  },
  logged_in_as: {
    en: 'Active Account',
    ar: 'الحساب النشط',
  },
  // Real-time Connection
  connected: {
    en: 'LIVE SYNC',
    ar: 'مزامنة حية',
  },
  connecting: {
    en: 'Connecting...',
    ar: 'جارٍ الاتصال...',
  },
};

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('ccc_language') as Language) || 'ar'; // Default Arabic as requested
  });

  const isRtl = language === 'ar';

  useEffect(() => {
    localStorage.setItem('ccc_language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [language, isRtl]);

  const toggleLanguage = () => {
    setLangState((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  const setLanguage = (lang: Language) => {
    setLangState(lang);
  };

  const t = (key: string): string => {
    if (translations[key]) {
      return translations[key][language] || key;
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
