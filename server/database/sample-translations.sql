-- Sample translations for testing the bilingual system
INSERT INTO translations (key, en, ar) VALUES
-- Common
('home', 'Home', 'الرئيسية'),
('tasks', 'Tasks', 'المهام'),
('dashboard', 'Dashboard', 'لوحة التحكم'),
('users', 'Users', 'المستخدمين'),
('settings', 'Settings', 'الإعدادات'),
('profile', 'Profile', 'الملف الشخصي'),
('language', 'Language', 'اللغة'),
('help', 'Help', 'مساعدة'),
('notifications', 'Notifications', 'الإشعارات'),
('logout', 'Logout', 'تسجيل الخروج'),

-- Common actions
('create', 'Create', 'إنشاء'),
('edit', 'Edit', 'تعديل'),
('delete', 'Delete', 'حذف'),
('save', 'Save', 'حفظ'),
('cancel', 'Cancel', 'إلغاء'),
('submit', 'Submit', 'إرسال'),
('search', 'Search', 'بحث'),
('filter', 'Filter', 'تصفية'),
('export', 'Export', 'تصدير'),
('import', 'Import', 'استيراد'),

-- Status
('active', 'Active', 'نشط'),
('inactive', 'Inactive', 'غير نشط'),
('published', 'Published', 'منشور'),
('draft', 'Draft', 'مسودة'),
('archived', 'Archived', 'أرشيف'),
('deleted', 'Deleted', 'محذوف'),
('pending', 'Pending', 'قيد الانتظار'),
('completed', 'Completed', 'مكتمل'),
('inProgress', 'In Progress', 'قيد التنفيذ'),
('failed', 'Failed', 'فشل'),

-- Messages
('noDataFound', 'No data found', 'لم يتم العثور على بيانات'),
('loading', 'Loading...', 'جاري التحميل...'),
('success', 'Success', 'نجاح'),
('error', 'Error', 'خطأ'),
('warning', 'Warning', 'تحذير'),
('info', 'Information', 'معلومات'),

-- Dashboard
('welcomeBack', 'Welcome back', 'مرحباً بعودتك'),
('totalUsers', 'Total Users', 'إجمالي المستخدمين'),
('activeUsers', 'Active Users', 'المستخدمون النشطون'),
('totalTasks', 'Total Tasks', 'إجمالي المهام'),
('completedTasks', 'Completed Tasks', 'المهام المكتملة'),
('recentActivity', 'Recent Activity', 'النشاط الأخير'),
('quickActions', 'Quick Actions', 'إجراءات سريعة'),
('viewAll', 'View All', 'عرض الكل'),

-- Authentication
('login', 'Login', 'تسجيل الدخول'),
('email', 'Email', 'البريد الإلكتروني'),
('password', 'Password', 'كلمة المرور'),
('forgotPassword', 'Forgot Password?', 'نسيت كلمة المرور؟'),
('rememberMe', 'Remember me', 'تذكرني'),
('invalidCredentials', 'Invalid email or password', 'البريد الإلكتروني أو كلمة المرور غير صحيحة'),

-- Organizations
('organizations', 'Organizations', 'المنظمات'),
('organizationName', 'Organization Name', 'اسم المنظمة'),
('createOrganization', 'Create Organization', 'إنشاء منظمة'),
('editOrganization', 'Edit Organization', 'تعديل المنظمة'),

-- Reports
('reports', 'Reports', 'التقارير'),
('generateReport', 'Generate Report', 'إنشاء تقرير'),
('exportReport', 'Export Report', 'تصدير تقرير'),

-- Learning
('learning', 'Learning', 'التعلم'),
('courses', 'Courses', 'الدورات'),
('assessments', 'Assessments', 'التقييمات'),
('createCourse', 'Create Course', 'إنشاء دورة'),
('createAssessment', 'Create Assessment', 'إنشاء تقييم'),

-- Assets
('assets', 'Assets', 'الأصول'),
('assetManagement', 'Asset Management', 'إدارة الأصول'),
('addAsset', 'Add Asset', 'إضافة أصل'),

-- Attendance
('attendance', 'Attendance', 'الحضور'),
('checkIn', 'Check In', 'تسجيل الدخول'),
('checkOut', 'Check Out', 'تسجيل الخروج'),
('attendanceRecords', 'Attendance Records', 'سجلات الحضور'),

-- Tags
('tags', 'Tags', 'العلامات'),
('createTag', 'Create Tag', 'إنشاء علامة'),
('tagName', 'Tag Name', 'اسم العلامة'),

-- Admin
('admin', 'Admin', 'الإدارة'),
('adminSettings', 'Admin Settings', 'إعدادات الإدارة'),
('systemSettings', 'System Settings', 'إعدادات النظام'),

-- Common UI
('yes', 'Yes', 'نعم'),
('no', 'No', 'لا'),
('ok', 'OK', 'موافق'),
('close', 'Close', 'إغلاق'),
('back', 'Back', 'رجوع'),
('next', 'Next', 'التالي'),
('previous', 'Previous', 'السابق'),
('finish', 'Finish', 'إنهاء'),
('select', 'Select', 'اختيار'),
('selectAll', 'Select All', 'اختيار الكل'),
('apply', 'Apply', 'تطبيق'),
('reset', 'Reset', 'إعادة تعيين'),
('clear', 'Clear', 'مسح'),
('confirm', 'Confirm', 'تأكيد'),
('approve', 'Approve', 'موافقة'),
('reject', 'Reject', 'رفض'),

-- Date/Time
('today', 'Today', 'اليوم'),
('yesterday', 'Yesterday', 'أمس'),
('thisWeek', 'This Week', 'هذا الأسبوع'),
('thisMonth', 'This Month', 'هذا الشهر'),
('thisYear', 'This Year', 'هذا العام'),
('date', 'Date', 'التاريخ'),
('time', 'Time', 'الوقت'),

-- Validation
('required', 'This field is required', 'هذا الحقل مطلوب'),
('invalidEmail', 'Invalid email address', 'عنوان البريد الإلكتروني غير صالح'),
('minLength', 'Minimum length is {{min}} characters', 'الحد الأدنى للطول هو {{min}} حرف'),
('maxLength', 'Maximum length is {{max}} characters', 'الحد الأقصى للطول هو {{max}} حرف'),

-- Error messages
('somethingWentWrong', 'Something went wrong', 'حدث خطأ ما'),
('tryAgainLater', 'Please try again later', 'يرجى المحاولة مرة أخرى لاحقاً'),
('networkError', 'Network error. Please check your connection', 'خطأ في الشبكة. يرجى التحقق من اتصالك'),
('unauthorized', 'Unauthorized access', 'وصول غير مصرح به'),
('forbidden', 'Access forbidden', 'الوصول ممنوع'),
('notFound', 'Resource not found', 'المورد غير موجود');
