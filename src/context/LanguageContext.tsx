import React, { createContext, useContext, useState, type ReactNode } from 'react';

type Language = 'en' | 'bg' | 'es';

interface LanguageOption {
  code: Language;
  name: string;
  flag: string;
  label: string;
}

// Дефинираме интерфейс за всички преводи
interface TranslationKeys {
  highest: string;
  high: string;
  normal: string;
  low: string;
  priority: string;
  classmates: string;
  grades: string;
  rate: string;
  remove_from_favorites: string;
  add_to_favorites: string;
  
all_grades: string;
evaluation: string;
your_learning_communities: string;
join_community_with_code: string;
lessons_available: string;
no_lessons_found: string;
solutions_found: string;
activity_chart: string;
solutions: string;
  
  // Статистики и време
  no_grades_data: string;
  week_short: string;
  hours_ago: string;
  days_ago: string;
  this_week: string;
  
  // Съобщения и грешки
  error_pinning_message: string;
  
  // Филтри и обхват
  all_teachers_students: string;
  my_community_only: string;
  people: string;
  selected: string;
  unread_only: string;
  starred_only: string;
  with_attachments: string;
  clear_filters: string;
  
  // Състояния на поща
  inbox_empty: string;
  inbox_empty_desc: string;
  no_messages_desc: string;
  write_message: string;
  message_details: string;
  read: string;
  
  // Действия с messages
  archive: string;
  unarchive: string;
  pin: string;
  unpin: string;
  
  // Прикачени файлове
  attachments: string;
  add_attachments: string;
  direct: string;
  
  // Информация за студенти
  student_notifications_info: string;
  send_message_to: string;
  
  new_lesson: string;
new_lesson_in: string;
code_uploaded: string;
code_submitted: string;
challenge_solved: string;
lesson_completed: string;
completed_lesson: string;
lessons_to_read: string;
assignment_submission: string;
no_lessons_description: string;
browse_communities: string;
objectives: string;
read_lesson: string;
no_notifications_description: string;
learning_objectives: string;
prerequisites: string;
lesson_content: string;
sort_by_rating: string;
  sort_by_views: string;
  sort_by_date: string;
  
  // Филтри
  all_difficulties: string;
  
  // Статистики
  total_views: string;
tags: string;
mark_as_completed: string;
solved_challenge:string;
  overdue_assignments: string;
  overdue: string;
  sort_by_due_date: string;
  sort_by_completion: string;
  sort_by_submissions: string;
  direct_message: string;
  pending_request: string;
  
  // Статистики и графики
  total_points: string;
  last_4_weeks: string;
  grades_trend: string;
  active_students: string;
  student_activity_chart: string;
  activities: string;
  
  // Префикс за потребители (който се повтаря няколко пъти)
  user_prefix: string;
  
  // Основна грешка
  error: string;

unlisted:string;
has_been_published: string;
open_in_assignments: string;
and_notified: string;
assignment_created_action: string;
created_new_assignment: string;
students_notified:string;

  new_challenge: string;                          // "New Challenge"
  new_challenge_notification: string;             // "New Challenge"
  new_challenge_available: string;                // "New challenge available"
  new_assignment_notification: string;             // "New Assignment"
  
  // ============ ПРЕДИЗВИКАТЕЛСТВА ============
  loading_solutions: string;                          // "Loading your solutions..."
  challenge_id: string;                                 // "Challenge ID"
  challenge_not_loaded: string;                         // "Challenge not loaded"
  solution_status: string;                               // "Solution Status"
  your_grade: string;                                    // "Your Grade"
  view_feedback: string;                                 // "View Feedback"
  evaluated_by: string;                                  // "Evaluated by"
  code_copied: string;                                    // "Code copied to clipboard!"
  no_code_to_copy: string;                                // "No code to copy"
  your_name: string;                                      // "Your name"
 new_assignment: string;
  show_less:string;
active_challenge:string;

  challenge_created_notification: string;    // "📢 New challenge {title} has been created!"
  challenge_accepted_notification: string;   // "✅ Challenge {title} has been accepted!"
  challenge_responded_notification: string;  // "💬 Teacher responded to challenge {title}"
  challenge_completed_notification: string;  // "🎉 Challenge {title} has been completed!"
  challenge_created: string;                  // "✅ Challenge created for"
  challenge_deleted: string;                    // "✅ Challenge deleted!"
  
  responded: string;                            // "responded"
  rejected: string;                             // "rejected"
  submitted: string;                             // "submitted"
  evaluated: string;                             // "evaluated"
  waiting: string;                               // "Waiting"
  action_needed: string;                         // "Action needed"
  done: string;                                  // "Done"
  more: string;                                  // "more"
  
  // ============ ГРЕШКИ ============
  error_loading_challenges: string;              // "❌ Error loading challenges! Firebase index may be missing."
  error_accepting_challenge: string;             // "❌ Error accepting challenge!"
  error_rejecting_challenge: string;              // "❌ Error rejecting challenge!"
  error_creating_challenge: string;               // "❌ Error creating challenge!"
  error_sending_response: string;                 // "❌ Error sending response!"
  error_deleting_challenge: string;               // "❌ Error deleting challenge!"
  error_grading_submission: string;               // "❌ Error grading submission!"
  
  // ============ УСПЕШНИ СЪОБЩЕНИЯ ============
  submission_graded: string;                      // "✅ Submission graded! Challenge completed!"
  response_sent: string;                           // "✅ Response sent successfully!"
  
  // ============ НОТИФИКАЦИИ ============
  your_submission_received: string;                // "Your submission for"
  received: string;                                 // "received"
  
  // ============ ФОРМИ ЗА ПРЕДИЗВИКАТЕЛСТВА ============
  challenge_will_be_created_for: string;           // "Challenge will be created for"
  max_points: string;                               // "Max points"
  students_accepted: string;                        // "students accepted"
  students_who_accepted: string;                    // "Students who accepted this challenge"

  no_submissions_desc: string;                       // "No students have submitted solutions for this challenge yet."
  view_submissions: string;                          // "View submissions"
  grade_submission: string;                          // "Grade Submission"
  update_grade: string;                              // "Update Grade"

  solution_code: string;                             // "Solution Code"

  enter_score: string;                               // "Enter score"
  provide_feedback: string;                          // "Provide feedback to the student..."
  
  
  // ============ ОБЩНОСТИ ============
  your_communities: string;                          // "Your Communities"
  no_community_selected_title: string;               // "No Community Selected"
  no_community_selected_desc: string;                // "Please select a community from the dropdown above to view and manage challenges."
  
  // ============ ПРЕДИЗВИКАТЕЛСТВА - СЪЗДАВАНЕ ============
  create_first_challenge_for: string;                 // "Create your first challenge for"
  no_date: string;                                     // "No date"
  deleting: string;                                    // "Deleting..."
  
  // ============ ОЦЕНЯВАНЕ ============
  needs_grading: string;                               // "⚠️ Needs grading!"

  
  // ============ ВАЛИДАЦИЯ ============
  must_be_logged_in: string;                          // "❌ You must be logged in!"
  only_creator_can_delete: string;                     // "❌ Only the creator can delete this challenge!"
  confirm_delete_challenge: string;                    // "Are you sure you want to delete this challenge?"
challenge_completed: string;     // "Challenge Completed!" или "Предизвикателството е завършено!"
  student_accepted: string;       

  published: string;           
all_lessons: string;         
search_lessons: string;    
total_lessons: string;      
no_matching_lessons: string; 
try_changing_criteria: string; 
  continue_work:string;
  start_assignment:string;
  creating:string;
  accept:string;
example_code_hint:string;
message_thread: string;          
start_conversation: string;       
type_message: string;            
just_now: string;                
all_messages_read: string;     
messages_sent: string;           
message_all: string;             
student_wants_to_join: string;   
join_request: string;    
lesson_updated: string;          
lesson_created: string;          
error_saving_lesson: string;     
confirm_delete_lesson: string;   
lesson_deleted: string;           
error_deleting_lesson: string;   
programming: string;            
new_lesson_created: string;          
need_community_for_challenges: string;    
no_community_selected: string;             
select_community_for_challenges: string;   
go_to_communities: string;                 
challenge_sent: string;                   
sent_successfully: string;          
grade_notification: string;        // 'Your work "{file}" has been graded. Points: {points}/10. Feedback: {feedback}'
grade_assigned: string;             // "Grade Assigned"
grade_assigned_details: string;     // 'Assigned {points}/10 points for "{file}"'
error_saving_grade: string;         // "Error saving grade! Check console for details."
graded: string;                      // "graded" (за филтри)
unknown_student: string;   
community_created: string;           // "Community created successfully!"
error_creating_community: string;    // "Error creating community!"
student_approved: string;            // "Student approved successfully!"
error_approving_student: string;     // "Error approving student!"
request_rejected: string;             // "Request rejected!"
error_rejecting_request: string;      // "Error rejecting request!"
id: string;              
created_expert_system: string;      // "Created expert system for biology project"
uploaded_assignment: string;         // "Uploaded assignment file"
completed_logical_rules: string;   





  untitled_assignment:string;
learn_and_practice:string;
unknown_action:string;
requested_to_join_community:string;
not_specified:string;
submission:string;
no_lessons_yet:string;
create_first_lesson:string;


mark_all_as_read_confirm:string;
symbolic_ai_expert_system: string;
notifications: string;
delete_notification: string;

  // Общности
  unnamed_community: string;
  no_description: string;
  untitled_challenge: string;
  challenge_solution: string;
  challenge: string;
  joined_the_challenge: string;
  submitted_challenge_solution: string;
  
  // Съобщения
  delete_message_error: string;
  delete_all_messages_error: string;
  delete_read_messages_confirm: string;
  delete_unread_messages_confirm: string;
  unread_messages: string;
  delete_messages_error: string;
  mark_messages_error: string;
  no_messages_from_user: string;
  this_user: string;
  delete_messages_from_user_confirm: string;
  messages_from: string;
  deleted: string;
  attachments_cannot_be_forwarded: string;
  // Задания и файлове
  unknown_assignment: string;
  unknown_file: string;
  introduction_to_prolog: string;
  excellent_work_prolog: string;
  expert_systems_design: string;
  good_work_detailed_rules: string;
  symbol_ai_expert_system: string;
  submitted_prolog_code: string;
  submitted_assignment: string;
  accepted: string;
  
  // Нотификации
  delete_notification_error: string;
  delete_all_notifications_error: string;
  notification: string;
  work_on_challenges: string;

  
  // Оценки
  detailed_view: string;
  view_grade_details: string;

  
  // Общи бутони и действия
  delete_all: string;
  delete_all_messages_confirm: string;
  delete_all_notifications_confirm: string;
  new_messages_will_appear_here: string;
  new_notifications_will_appear_here: string;
  today: string;
  grade_received: string;
  system: string;
  no_notifications: string;
  created_new_challenge: string;
has_been_accepted: string;
challenge_response: string;
responded_to: string;
has_been_completed: string;
challenge_notification_sent: string;
sent_notifications: string;

  good_logic: string;
improve_comments: string;
grade_assignment: string;
saving: string;
no_file_selected: string;
grade_all_work: string;
my_grades: string;
view_all_grades: string;
refresh_grades: string;
click_to_view_grades: string;
see_detailed_grades_feedback: string;
open_grades_view: string;
grades_received: string;
no_grades_yet: string;
complete_assignments_to_get_grades: string;
total_grades: string;
average_grade: string;
excellent_grades: string;
graded_by: string;
recently: string;
viewing_grade_details: string;
full_feedback: string;
score: string;
access_denied: string;
  teacher_only: string;
  logout_failed: string;
  error_loading_lessons: string;
  error_loading_grades: string;
  error_loading_challenge_stats: string;
  error_marking_read: string;
  error_marking_all_read: string;
  error_marking_notifications: string;
  error_loading_activity: string;
  error_sending_notification: string;
  error_adding_activity: string;
  error_loading_thread: string;
  error_opening_file: string;
  error_downloading_file: string;
  error_details: string;
  stats_icon_chart: string;
stats_icon_check: string;
stats_icon_warning: string;
stats_icon_star: string;
stats_icon_trophy: string;
stats_icon_users: string;
stats_icon_activity: string;
  
  // Задания и предизвикателства
  total_challenges: string;
  pending_challenges: string;
  in_draft: string;
  no_active_challenges: string;
  recent_challenges: string;
  completion: string;
  avg_score: string;
  respond: string;
  accepted_students: string;
  completed_students: string;
  created_by: string;
  
  // Нива
  beginner: string;
  intermediate: string;
  advanced: string;
  
  // Общности
  total_communities: string;
  new_community: string;
  no_communities: string;
  community_activity: string;
  no_community_activity: string;
  
  // Уроци
  no_lessons: string;
  recent_lessons: string;
  create_first: string;
  mountains:string;
  
  // Съобщения и поща
  mailbox: string;
  recent_messages: string;
  total_messages: string;
  no_files: string;
  
  // Студенти
  students_in_system: string;
  student_list: string;
  all_students: string;
  no_student_data: string;
  
  // Файлове и качване
  drag_drop: string;
  upload: string;
  
  // Основни навигационни секции
  main: string;
  learning: string;
  content: string;
  activity: string;
  
  // Форми и въвеждане
  name: string;
  enter_name: string;
  
  // Примери
  grade_example: string;
  subject_example: string;
  
  // Табло и статистики
  dashboard_description: string;
  recent_grades: string;
  no_recent_grades: string;
  
grade_distribution: string;
  challenge_not_found: string;
already_joined_challenge: string;
select_challenge_first: string;
code_empty: string;
challenge_not_joined: string;
challenge_submitted: string;
challenge_submission_error: string;
select_assignment_first: string;
assignment_not_found: string;
submit_challenge_solution: string;
challenge_mode: string;
current_challenge: string;
challenge_mode_active: string;
exit_challenge_mode: string;
no_challenge_selected: string;
select_challenge_first_desc: string;
go_to_challenges: string;
switch_to_assignments: string;
select_file_to_grade: string;
switch_to_challenges: string;
submit_solution: string;
  please_login: string;
teacher_pending_approval: string;
welcome_teacher: string;
account_under_review: string;
admin_approval_needed: string;
step_1: string;
profile_created: string;
create_profile: string;
step_2: string;
awaiting_admin_approval: string;
step_3: string;
access_dashboard: string;
your_information: string;
email: string;
what_happens_next: string;
step1_description: string;
step2_description: string;
step3_description: string;
refresh_status: string;
challenge_rejected: string;
challenge_reject_error: string;
challenge_accepted: string;
challenge_accept_error: string;
approve: string;
reject: string;
challenge_response_title: string;
challenge_solution_title: string;
challenge_view_solution_code: string;
challenge_response_from: string;
challenge_respond: string;
challenge_reject_confirm: string;
challenge_view_response: string;
challenge_response_content: string;
challenge_response_placeholder: string;
challenge_solution_code: string;
challenge_solution_code_placeholder: string;
challenge_send_response: string;

contact_admin: string;
estimated_approval_time: string;

  user: string;                    // Добави този
  message_to_all_desc: string;
   no_messages: string;
  mark_all_as_read: string;
  messages_as_read: string;
  all_messages_marked_as_read: string;
  error_updating_messages: string;
  no_read_messages: string;
  delete_read_messages: string;
  read_messages: string;
  messages_deleted: string;
  delete_all_messages: string;
  open_messages: string;
  in_my_community: string;
  error_loading_community: string;
  no_community: string;
  remove_star: string;
  star: string;
  select_message: string;
  select_message_to_view: string;
  to_community: string;
   message_to_all_community: string;
  message_to_community_members: string;
  no_students_in_community: string;
  no_community_members: string;
  teachers_and_my_students: string;
  community_students: string;
  my_community_members: string;
  community_teacher: string;
  other_teachers: string;
  my_students: string;
  available_recipients: string;
  my_community: string;
  student_messages: string;
  teacher_messages: string;
  available_users: string;
  broadcast_teachers_only: string;
  not_your_community: string;
  not_in_community: string;
  cannot_send_outside_community: string;
  cannot_send_to_student: string;
  quick_message: string;
  quick_message_desc: string;
  open_mail: string;
  broadcast_all_students: string;
  type_your_message_here: string;
  new_messages: string;
  mark_all_read_confirm: string;
  click_to_mark_read: string;
  view_all_messages: string;
  students_in_my_communities: string;
  assignments_created_by_me: string;
  in_system: string;
  other_teachers_in_system: string;
  my_students_activities: string;

  manage_learning_communities: string;
  create_community: string;
  create_first_community: string;
  pending_requests: string;
  manage_community_challenges: string;
  create_challenge: string;
  create_first_challenge: string;
  to: string;
  no_activity_data: string;
  
  // Дни от седмицата (съкратени)
  monday_short: string;
  tuesday_short: string;
  wednesday_short: string;
  thursday_short: string;
  friday_short: string;
  saturday_short: string;
  sunday_short: string;
  communities_overview: string;
  no_communities_dashboard: string;
  view_all_communities: string;
  community_name: string;
  enter_community_name: string;
  grade_level: string;
  privacy_settings: string;
  auto_approve_students: string;
  allow_student_messages: string;
  allow_student_challenges: string;
  allow_inter_community_challenges: string;
  challenge_title: string;
  enter_challenge_title: string;
  target_community: string;
  select_community: string;
  send_challenge: string;
  no_activity: string;
  no_student_activities: string;
  lesson_title_required: string;
  join_communities: string;
  join_community_dashboard: string;
  community_join_info: string;
  community_creation_note: string;
  community_creation_help: string;
  solution_submitted: string;
  solution_error: string;
  join_request_sent: string;
  join_request_error: string;
  invalid_invite_code: string;
  join_error: string;
  message_sent: string;
  message_error: string;
  challenge_joined_success: string;
  challenge_join_error: string;
  my_solutions: string;
  challenges: string;
  learning_communities: string;
  challenges_in_progress: string;
  enter_invite_code: string;
  join: string;
  my_communities: string;
  no_communities_yet: string;
  join_community_description: string;
  members: string;
  public: string;
  private: string;
  general: string;
  view_challenges: string;
  community_members: string;
  active_challenges: string;
  no_challenges_yet: string;
  no_challenges_description: string;
  participants: string;
  joined: string;
  solve_now: string;
  join_challenge: string;
  
  // Статистики и метрики
  registered_students: string;
  pending_approvals: string;
  waiting_for_review: string;
  student_performance: string;
  lesson_progress: string;
  completed_lessons: string;
  
  // Заглавия и секции
  student_activities: string;
  recent_assignments: string;
  last_activity: string;
  
  // Форми и входни полета
  lesson_title: string;
  enter_lesson_title: string;
  enter_description: string;
  
  // Действия и бутони
  add_lesson: string;
  
  // Статуси
  pending_approval: string;

  // Основни действия и бутони
  close: string;
  download_code: string;
  download: string;
  view_grade: string;
  view_download_submissions: string;
  new_submission: string;
  resubmit: string;
  
  // Времеви метаданни
  graded_on: string;
  submitted_on: string;
  pending_evaluation: string;
  
  // Състояния на задачите
  assignment_not_graded: string;
  
  // Заглавия и секции
  assignment_evaluation: string;
  
  // Статистики и метрики
  code_execution_success: string;
  consecutive_days_active: string;
  keep_it_up: string;
  pending_assignments: string;
  needs_submission: string;
  requires_attention: string;
  
  // Съобщения и текст
  no_recent_activity: string;
  
  about_us: string;
  prolog_demo: string;
  select_domain_to_view_code: string;
  
  // Категории
  prolog_programming: string;
  artificial_intelligence: string;
  databases: string;
  algorithms: string;
  logic_programming: string;

  // Заглавия и подзаглавия
  learning_topics: string;
  explore_materials: string;
  all_topics: string;
  all_learning_topics: string;
  explore_category_topics: string;
  browse_all_topics: string;
  topics_completed: string;
  lessons_completed: string;

  // Бърз достъп и менюта
  quick_access: string;
  search_topics: string;
  categories: string;

  // Статуси и действия
  start_learning: string;
  start_course: string;
  start_lesson: string;
  review_lesson: string;
  ask_ai_about_topic: string;
  ask_ai_about_lesson: string;
  bookmark_lesson: string;
  challenge_accept: string;

  // Зареждане и съобщения
  loading_topics: string;
  no_topics_found: string;
  no_topics_for_category: string;
  select_topic_prompt: string;
  choose_topic_from_list: string;
  no_lessons_available: string;
  no_lessons_for_topic: string;

  lesson: string; // единично число
  duration: string;
  course_lessons: string;
  
  // Заглавия и подзаглавия
  prolog_guide_subtitle: string;
  prolog_guide_description: string;

  // Табове
  tab_basics: string;
  tab_examples: string;
  tab_tutorials: string;
  tab_resources: string;

  // Основи на Prolog - заглавия
  basics_facts_title: string;
  basics_rules_title: string;
  basics_queries_title: string;

  // Основи на Prolog - описания
  basics_facts_desc: string;
  basics_rules_desc: string;
  basics_queries_desc: string;

  // Основи на Prolog - точки (масиви)
  basics_facts_p1: string;
  basics_facts_p2: string;
  basics_facts_p3: string;
  basics_facts_p4: string;

  basics_rules_p1: string;
  basics_rules_p2: string;
  basics_rules_p3: string;
  basics_rules_p4: string;

  basics_queries_p1: string;
  basics_queries_p2: string;
  basics_queries_p3: string;
  basics_queries_p4: string;
  inbox: string;
  starred: string;
  sent: string;
  drafts: string;
  trash: string;
  unknown_user: string;
  error_loading_users: string;
  error_loading_communities: string;
  error_loading_messages: string;
  unknown: string;
  no_subject: string;
  login_required: string;
  message_content_required: string;
  recipient_required: string;
  recipient_not_found: string;
  cannot_send_to_self: string;
  community_not_found: string;
  no_users_in_community: string;
  no_other_users: string;
  invalid_message_type: string;
  new_message: string;
  you_have_new_message_from: string;
  error_sending_message: string;
  no_permission_send_messages: string;
  no_internet_connection: string;
  message_sent_to: string;
  recipients: string;
  recipient: string;
  error_starring_message: string;
  error_archiving_message: string;
  confirm_delete_message: string;
  message_moved_to_trash: string;
  error_deleting_message: string;
  delete_selected_messages: string;
  selected_messages: string;
  messages_moved_to_trash: string;
  error_deleting_messages: string;
  permanent_delete_confirm: string;
  message_permanently_deleted: string;
  error_permanent_delete: string;
  error_marking_message: string;
  no_unread_messages: string;
  messages_marked_as_read: string;
  error_marking_messages: string;
  loading_messages: string;
  messages_center: string;
  unread: string;
  in_community: string;
  mark_all_read: string;
  mark_all: string;
  new: string;
  community: string;
  all_users: string;
  message_to_community: string;
  user_list: string;
  found: string;
  no_users_found: string;
  important: string;
  select_all: string;
  no_new_messages: string;
  no_messages_found: string;
  no_messages_inbox: string;
  try_different_folder: string;
  me: string;
  broadcast: string;
  community_message: string;
  broadcast_message: string;
  original_message: string;
  reply: string;
  forwarded_message: string;
  forward: string;
  permanent_delete: string;
  message_to_all: string;
  message_type: string;
  personal: string;
  sending_to: string;
  message_to_community_desc: string;
  users_on_platform: string;
  username_or_email: string;
  message_subject: string;
  write_message_here: string;
  sending: string;
  search_messages: string;
  deselect: string;
  mark_as_read: string;
  delete_message: string;


  // Примери на код - заглавия и описания
  prolog_basics_title: string;
  prolog_basics_desc: string;
  prolog_basics_expl: string;

  prolog_recursion_title: string;
  prolog_recursion_desc: string;
  prolog_recursion_expl: string;

  prolog_lists_title: string;
  prolog_lists_desc: string;
  prolog_lists_expl: string;

  // Уроци - заглавия и съдържание
  tutorial_structure_title: string;
  tutorial_structure_content: string;
  tutorial_structure_ex1: string;
  tutorial_structure_ex2: string;
  tutorial_structure_ex3: string;
  tutorial_structure_ex4: string;

  tutorial_variables_title: string;
  tutorial_variables_content: string;
  tutorial_variables_ex1: string;
  tutorial_variables_ex2: string;
  tutorial_variables_ex3: string;
  tutorial_variables_ex4: string;

  tutorial_backtracking_title: string;
  tutorial_backtracking_content: string;
  tutorial_backtracking_ex1: string;
  tutorial_backtracking_ex2: string;
  tutorial_backtracking_ex3: string;
  tutorial_backtracking_ex4: string;

  // Бързи съвети
  quick_tips_title: string;
  quick_tips_subtitle: string;
  tip_1: string;
  tip_2: string;
  tip_3: string;
  tip_4: string;

  view_code_for_domain: string;
  upload_new_file_to: string;
  name_required: string;
  institution_required: string;
  email_required: string;

  // Полета и етикети
  full_name: string;
  enter_full_name: string;
  select_role: string;
  teacher_approval_note: string;
  institution: string;
  enter_institution: string;
  grade_course: string;
  enter_grade: string;
  specialty: string;
  enter_specialty: string;
  create_password: string;

  // Текстове от интерфейса
  join_community: string;
  register_description: string;
  start_journey: string;
  send_updates: string;

  // Student Dashboard специфични ключове
  student_account: string;
  practice_makes_perfect: string;
  practice_makes_perfect_desc: string;
  complete_assignments_early: string;
  complete_assignments_early_desc: string;
  challenge_response_on: string;
challenge_reject: string;
  join_study_group: string;
  join_study_group_desc: string;
  start_now: string;
  view_assignments: string;
  join_now: string;
  success_rate_trend: string;
  submit_assignments_projects: string;
  templates: string;
  submit_code: string;
  submissions_found: string;
  check_back_later: string;
  all_status: string;
  all_difficulty: string;
  browse_courses: string;
  view_course: string;
  continue: string;
  track_achievements: string;
  uploaded: string;
  expert_system: string;
  general_knowledge: string;
  general_assignment: string;
  date: string;
  prolog_submission: string;
  no_submissions_yet: string;
  assignments_found: string;
  total: string;
  success: string;
  successful_executions: string;
  assignments_completed: string;
  active_streak: string;
  current_activity_streak: string;
  review: string;
  lines: string;
  code_editor: string;

  // Teacher Dashboard ключове
  what_to_teach: string;
  all_time_submissions: string;
  completed_submissions: string;
  total_files_uploaded: string;
  overall_success_rate: string;
  new_today: string;
  assignment: string;
  course: string;
  file: string;
  grading: string;
  ago: string;
  add_new_assignment: string;
  top_students: string;
  avg: string;
  recommendations: string;
  my_lessons: string;
  manage_organize_lessons: string;
  add_new_lesson: string;
  preview: string;
  manage_create_assignments: string;
  add_assignment: string;
  upload_first_file: string;
  no_email: string;
  na: string;
  no_files_uploaded: string;
  add_detailed_feedback: string;
  example_expert_system: string;
  example_insects: string;
  describe_objective: string;
  brief_description: string;
  instructions: string;
  add_instruction: string;
  enter_instruction: string;
  minimum_facts: string;
  minimum_rules: string;
  create_new_assignment: string;
  challenge_algorithms: string;
  new_course_ml: string;
  student_file_project: string;
  homework_check: string;
  visual_examples: string;
  visual_examples_desc: string;
  apply: string;
  group_work: string;
  group_work_desc: string;
  start: string;
  short_break: string;
  short_break_desc: string;
  create: string;

  quick_links: string;
  schedule_demo: string;
  explore_community: string;
  made_with_love: string;
  
  // Header преводи
  home: string;
  topics: string;
  dashboard: string;
  prolog_chat: string;
  sign_in: string;
  get_started: string;
  logout: string;
  innovation_platform: string;
  admin_dashboard: string;
  remove_bookmark: string;
  like: string;
  // Добави след вече съществуващите ключове
  review_code: string;
  start_work: string;
  select_assignment: string;
  todays_tasks: string;
  task_details: string;
  no_tasks_today: string;
  all_caught_up: string;
  assignment_progress: string;
  difficulty_distribution: string;
  by_difficulty: string;
  no_active_assignments: string;
  facts: string;
  rules: string;
  review_submission: string;
  assignment_completion: string;
  header_copied: string;
  copy_header: string;
  prolog: string;
  lessons: string;
  
  // Home page преводи
  ideas_acronym: string;
  hero_title_part1: string;
  hero_title_part2: string;
  hero_description: string;
  get_started_free: string;
  view_demos: string;
  schools: string;
  students: string;
  projects: string;
  features_title_part1: string;
  features_title_part2: string;
  features_description: string;
  feature1_title: string;
  feature1_description: string;
  feature2_title: string;
  feature2_description: string;
  feature3_title: string;
  feature3_description: string;
  feature4_title: string;
  feature4_description: string;
  feature5_title: string;
  feature5_description: string;
  feature6_title: string;
  feature6_description: string;
  explore_tools: string;
  start_collaborating: string;
  view_projects: string;
  see_analytics: string;
  browse_curriculum: string;
  learn_skills: string;
  demo_title_part1: string;
  demo_title_part2: string;
  demo_description: string;
  demo_feature1_title: string;
  demo_feature1_description: string;
  demo_feature2_title: string;
  demo_feature2_description: string;
  demo_feature3_title: string;
  demo_feature3_description: string;
  demo_feature4_title: string;
  demo_feature4_description: string;
  explore_live_demos: string;
  try_free_tutorial: string;
  all_visibility: string;
  view_template: string;
  // Footer преводи
  footer_description: string;
  footer_platform: string;
  footer_support: string;
  help_center: string;
  contact_us: string;
  privacy_policy: string;
  terms_of_service: string;
  documentation: string;
  submissions: string;
  all_rights_reserved: string;
  privacy: string;
  terms: string;
  cookies: string;
  challenge_view_submissions :string;
  
  create_knowledge_title: string;
  create_knowledge_desc: string;
  create_feature_1: string;
  create_feature_2: string;
  create_feature_3: string;
  start_creating: string;

  use_knowledge_title: string;
  use_knowledge_desc: string;
  use_feature_1: string;
  use_feature_2: string;
  use_feature_3: string;
  start_using: string;

  total_knowledge_bases: string;
  active_creators: string;
  educational_topics: string;
  
  // Dashboard преводи (основни)
  welcome_back: string;
  upload_code: string;
  upload_file: string;
  quick_stats: string;
  total_submissions: string;
  success_rate: string;
  upload_prolog_code: string;
  upload_prolog_file: string;
  my_submissions: string;
  active: string;
  no_data: string;
  successful: string;
  success_rate_small: string;
  file_uploads: string;
  folders: string;
  prolog_code_editor: string;
  save_draft: string;
  clear: string;
  write_prolog_code: string;
  example: string;
  upload_code_button: string;
  clear_editor: string;
  upload_success: string;
  no_file_user: string;
  only_pl_files: string;
  upload_failed: string;
  file_upload_success: string;
  unexpected_error: string;
  status_success: string;
  status_error: string;
  status_pending: string;
  select_folder: string;
  drag_drop_file: string;
  or_click_browse: string;
  upload_to_folder: string;
  clear_selection: string;
  only_pl_files_info: string;
  files_saved_in: string;
  recent_submissions: string;
  all: string;
  success_filter: string;
  files_filter: string;
  no_submissions: string;
  start_uploading: string;
  upload_first_code: string;
  no_code_preview: string;
  view_details: string;
  run_again: string;
  
  // Нови dashboard преводи от кода
  welcome_subtitle: string;
  search_placeholder: string;
  learning_platform: string;
  my_courses: string;
  assignments: string;
  progress: string;
  settings: string;
  learning_progress: string;
  week: string;
  month: string;
  year: string;
  all_time: string;
  completion_rate: string;
  total_study_hours: string;
  completed_tasks: string;
  streak_days: string;
  progress_over_time: string;
  skill_distribution: string;
  recent_activity: string;
  completed_assignment: string;
  uploaded_file: string;
  achieved_milestone: string;
  browse_files: string;
  or: string;
  upload_to: string;
  make_first_submission: string;
  all_assignments: string;
  in_progress: string;
  completed: string;
  pending: string;
  due: string;
  tasks: string;
  details: string;
  continue_learning: string;
  complete: string;
  weekly_progress: string;
  weekly_completion: string;
  learning_hours: string;
  daily_study_hours: string;
  my_assignments: string;
  articles: string;
  view_all: string;
  
  // Login page преводи
  login_description: string;
  access_projects: string;
  track_progress: string;
  collaborate_peers: string;
  sign_in_account: string;
  enter_credentials: string;
  email_address: string;
  enter_email: string;
  password: string;
  enter_password: string;
  remember_me: string;
  forgot_password: string;
  signing_in: string;
  sign_in_ideas: string;
  new_to_ideas: string;
  create_account: string;
  terms_agreement: string;
  and: string;
  new_join_request:string;
  communities: string;
  from: string;
  my_challenge_solutions: string;
  no_solutions_yet: string;
  join_challenges_to_solve: string;
  browse_challenges: string;
  view_solution: string;
  continue_solving: string;
  message_community: string;
  message: string;
  messages: string;
  type_message_here: string;
  select_recipient: string;
  teachers: string;
  message_history: string;
  you: string;
  no_messages_yet: string;
  
  // Register page преводи
  register_title: string;
  register_journey_title: string;
  register_platform_description: string;
  join_platform: string;
  interactive_tutorials: string;
  hands_on_projects: string;
  collaborative_learning: string;
  progress_tracking: string;
  create_your_account: string;
  start_stem_journey: string;
  confirm_password: string;
  confirm_password_placeholder: string;
  password_placeholder: string;
  i_agree_to: string;
  send_me_updates: string;
  creating_account: string;
  create_ideas_account: string;
  already_have_account: string;
  sign_in_existing: string;
  register_footer_text: string;
  
  // Validation messages преводи
  password_mismatch: string;
  password_too_short: string;
  password_weak: string;
  email_in_use: string;
  invalid_email: string;
  
  // Register success message
  registration_successful: string;
  
  // Theme toggle преводи
  switch_to_light: string;
  switch_to_dark: string;
  dark_mode: string;
  light_mode: string;
  
  // Нови преводи за липсващите ключове
  what_to_learn: string;
  explore_courses: string;
  
  // Нови преводи за PrologChat
  prolog_assistant: string;
  domain_based_knowledge: string;
  chat_stats: string;
  active_domain: string;
  domain: string;
  no_active_domain: string;
  knowledge_domains: string;
  clear_domain: string;
  clear_chat: string;
  chat: string;
  code_preview: string;
  system_commands: string;
  file_management: string;
  enter_filename: string;
  file_command_hint: string;
  responses: string;
  expand_chat: string;
  collapse_chat: string;
  loading_domain: string;
  domain_loaded_success: string;
  domain_load_error: string;
  thinking: string;
  no_server_response: string;
  connection_error: string;
  select_domain_first: string;
  enter_prolog_query: string;
  press_enter_to_send: string;
  queries_end_with_period: string;
  connected_to: string;
  send: string;
  no_domain_selected: string;
  select_domain_to_view: string;
  no_code_files_for: string;
  upload_code_for_domain: string;
  files: string;
  no_domain: string;
  copy_code: string;
  view_full_code: string;
  api_server: string;
  queries: string;
  code_files: string;
  none: string;
  status: string;
  animals: string;
  history: string;
  geography: string;
  mineral_water: string;
  animal_facts_description: string;
  historical_facts_description: string;
  geographical_facts_description: string;
  mineral_water_description: string;
  help: string;
  load_all: string;
  list_files: string;
  clear_facts: string;
  current_file: string;
  list_predicates: string;
  unload_all: string;
  consult_file: string;
  reconsult_file: string;
  unload_file: string;
  switch_file: string;
  example_queries: string;
  
  // Tooltips
  help_tooltip: string;
  load_all_tooltip: string;
  list_files_tooltip: string;
  clear_facts_tooltip: string;
  current_file_tooltip: string;
  list_predicates_tooltip: string;
  unload_all_tooltip: string;
  consult_file_tooltip: string;
  reconsult_file_tooltip: string;
  unload_file_tooltip: string;
  switch_file_tooltip: string;
  
  // Добави след вече съществуващите ключове
  choose_assignment: string;
  use_template: string;
  assignment_info: string;
  title: string;
  requirements: string;
  file_information: string;
  type: string;
  student_name: string;
  data_area: string;
  prolog_code: string;
  update_header: string;
  no_permission_delete: string;
message_deleted: string;
messages_processed: string;
  
  // Балкан преводи
  balkan: string;
  balkan_description: string;
  central_balkan: string;
  
  // Нови преводи за Header и PrologChat
  file_commands: string;
  loading: string;
  upload_new_file: string;
  drag_drop_file_to_upload: string;
  uploading: string;
  no_file_user_domain: string;
  uploading_file: string;
  upload_to_domain: string;
  code: string;
  file_commands_title: string;
  
  completed_assignments_count: string;
  in_progress_assignments_count: string;
  total_assignments_count: string;
  
  // НОВИ ДОБАВЕНИ КЛЮЧОВЕ ОТ DASHBOARD КОДА:
  student: string;
  class: string;
  average_points: string;
  actions: string;
  grade_saved: string;
  for: string;
  feedback_saved: string;
  close_window: string;
  load_assignments_error: string;
  login_as_teacher: string;
  assignment_updated: string;
  assignment_created: string;
  save_assignment_error: string;
  assignment_deleted: string;
  confirm_delete_assignment: string;
  loading_students: string;
  no_access_rights: string;
  load_students_error: string;
  excellent: string;
  good: string;
  average: string;
  needs_improvement: string;
  poor: string;
  load_assignments: string;
  no_assignments_yet: string;
  create_first_assignment: string;
  edit_assignment: string;
  create_assignment: string;
  assignment_title: string;
  assignment_title_placeholder: string;
  topic: string;
  topic_placeholder: string;
  subject: string;
  biology: string;
  chemistry: string;
  physics: string;
  other: string;
  due_date: string;
  objective: string;
  objective_placeholder: string;
  description: string;
  description_placeholder: string;
  background_image: string;
  category: string;
  minimum_requirements: string;
  min_facts: string;
  min_rules: string;
  combined_rules: string;
  menu_items: string;
  difficulty: string;
  easy: string;
  medium: string;
  hard: string;
  points: string;
  example_code: string;
  example_code_placeholder: string;
  optional: string;
  cancel: string;
  save_changes: string;
  create_articles: string;
  draft: string;
  bookmark: string;
  archived: string;
  edit: string;
  delete: string;
  view: string;
  active_assignments: string;
  total_assignments: string;
  category_statistics: string;
  assignment_distribution: string;
  manage_students_subtitle: string;
  search_students: string;
  refresh: string;
  export: string;
  filter: string;
  please_wait: string;
  no_students_found: string;
  no_students_description: string;
  try_again: string;
  last_upload: string;
  avg_points: string;
  grade: string;
  view_files: string;
  send_message: string;
  more_options: string;
  student_files: string;
  file_folder: string;
  file_date: string;
  file_size: string;
  view_code: string;
  download_file: string;
  grade_file: string;
  no_files_found: string;
  grade_student: string;
  assign_points: string;
  selected_points: string;
  feedback: string;
  add_feedback_placeholder: string;
  excellent_work: string;
  needs_correction: string;
  missing_requirements: string;
  creative_solution: string;
  save_grade: string;
  showing: string;
  of: string;
  showing_of: string;
  
  // НОВИ КЛЮЧОВЕ ОТ ПОСЛЕДНИЯ АНАЛИЗ:
  teacher_dashboard: string;
  student_dashboard: string;
  teacher: string;
  assignment_instructions_1: string;
  assignment_instructions_2: string;
  assignment_instructions_3: string;
  assignment_instructions_4: string;
  assignment_instructions_5: string;
  assignment_instructions_6: string;
  delete_assignment_error: string;
  untitled: string;
  no_code: string;
  uncategorized: string;
  completed_assignments: string;
  in_progress_assignments: string;
  
  // Във ВСЕКИ от вашите преводни файлове (bg, en, es) добавете:
  // Заглавия и раздели
  dashboard_schools: string;
  dashboard_knowledge: string;
  dashboard_education: string;

  // Статистики
  total_schools: string;
  active_schools_dash: string;
  registered_users: string;
  active_users_dash: string;
  biology_bases: string;
  geography_bases: string;
  mathematics_bases: string;
  chemistry_bases: string;
  physics_bases: string;
  history_bases: string;
  literature_bases: string;
  language_bases: string;

  // Интерфейс
  live_status: string;
  schools_short: string;
  knowledge_short: string;
  education_short: string;
  auto_rotate: string;

  // Графики
  growth_trend_schools: string;
  growth_trend_knowledge: string;
  growth_trend_education: string;
  last_7_days: string;

  // Допълнителна информация
  platform_activity: string;
  this_month: string;
  data_security: string;

  // Активности
  activity_new_school: string;
  activity_knowledge_base: string;
  activity_new_materials: string;
  activity_user_registered: string;
  minutes_ago: string;
  // ============================================
// PrologGuide - НОВИ КЛЮЧОВЕ
// ============================================
tutorials: string;
examples: string;
resources: string;
prolog_guide_intro_title: string;
prolog_guide_intro_desc: string;
lessons_videos: string;
extra: string;
puzzle: string;
video: string;

no_lessons_desc: string;
back_to_lessons: string;
previous: string;
next: string;
visit: string;

output: string;
language: string;




  // Статуси за потребители
  warning: string;
  inactive: string;
  
  // Учителски инструкции
  teacher_name: string;
  secure_login: string;
  security_description: string;
  
  // Статистика
  total_students: string;
  total_files: string;
  no_uploads: string;
  code_updated: string;
  upload_error: string;
  not_pl_file: string;
  upload_successful: string;
  catch_block_error: string;
  option: string;
  loading_assignments: string;
  videos: string;         // "Videos"
  puzzles: string;        // "Puzzles"
  extras: string;         // "Extras"
 
  
  // Типове уроци
 
  
  // Съобщения за липса на съдържание
  no_videos: string;           // "No Videos Available"
  no_videos_desc: string;      // "Check back later for video lessons."
  no_puzzles: string;          // "No Puzzles Available"
  no_puzzles_desc: string;     // "Check back later for puzzles."
  no_extras: string;           // "No Extra Content Available"
  no_extras_desc: string;      // "Check back later for extra content."

  introduction_title: string;  // "Introduction to Logic Programming"
  introduction_description: string; // "This structured course will guide you..."
  
  // Добави тези ключове в интерфейса TranslationKeys:
  status_completed: string;
  status_in_progress: string;
}

// Тип за обекта с всички преводи
type Translations = {
  [key in Language]: TranslationKeys;
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  languageOptions: LanguageOption[];
  currentLanguage: LanguageOption;
  t: (key: keyof TranslationKeys) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Преводите с правилната типизация
const translations: Translations = {
  en: {
    // ============================================
// PrologGuide
// ============================================

"tutorials": "Tutorials",
  "videos": "Videos",
  "puzzles": "Puzzles",
  "extras": "Extras",
  "examples": "Examples",
  "resources": "Resources",
  
  "video": "Video",
  "puzzle": "Puzzle",
  "extra": "Extra",
  
  "no_videos": "No Videos Available",
  "no_videos_desc": "Check back later for video lessons.",
  "no_puzzles": "No Puzzles Available",
  "no_puzzles_desc": "Check back later for puzzles.",
  "no_extras": "No Extra Content Available",
  "no_extras_desc": "Check back later for extra content.",
  "no_lessons": "No Lessons Available",
  "no_lessons_desc": "Check back later for new lessons.",
  
  "back_to_lessons": "Back to lessons",
  "previous": "Previous",
  "next": "Next",
  "visit": "Visit",
  "lesson": "Lesson",
  "example": "Example",
  "output": "Output",
  "duration": "Duration",
  "language": "Language",
  "lessons_videos": "Lessons & Videos",
  "introduction_title": "Introduction to Logic Programming",
  "introduction_description": "This structured course will guide you through the fundamental concepts of logic programming and Prolog. Each lesson combines theory with practical exercises.",

prolog_guide_intro_title: "Introduction to Logic Programming",
prolog_guide_intro_desc: "This structured course will guide you through the fundamental concepts of logic programming and Prolog. Each lesson combines theory with practical exercises.",



// ============================================
// Допълнителна информация
// ============================================
platform_activity: "Platform Activity",
this_month: "This Month",
data_security: "Data Security",

// ============================================
// Активности
// ============================================
activity_new_school: "New school added to the platform",
activity_knowledge_base: "Knowledge base updated",
activity_new_materials: "New educational materials uploaded",
activity_user_registered: "User registered",
minutes_ago: "minutes ago",

// ============================================
// Статуси за потребители
// ============================================
warning: "Warning",
inactive: "Inactive",

// ============================================
// Учителски инструкции
// ============================================
teacher_name: "Teacher Name",
secure_login: "Secure Login",
security_description: "Your data is encrypted and protected",

// ============================================
// Статистика
// ============================================
total_students: "Total Students",
total_files: "Total Files",
no_uploads: "No uploads yet",

// ============================================
// Други
// ============================================
not_pl_file: "File is not a .pl file",
upload_successful: "Upload successful",
catch_block_error: "An error occurred",
option: "Option",
loading_assignments: "Loading assignments...",
loading_solutions: "Loading your solutions...",
challenge_id: "Challenge ID",
challenge_not_loaded: "Challenge not loaded",
solution_status: "Solution Status",
your_grade: "Your Grade",
    new_challenge: "New Challenge",
  new_challenge_notification: "New Challenge",
  new_challenge_available: "New challenge available",
  new_assignment_notification: "New Assignment",

  view_feedback: "View Feedback",
  evaluated_by: "Evaluated by",
  code_copied: "Code copied to clipboard!",
  no_code_to_copy: "No code to copy",
  your_name: "Your name",
  new_assignment: "New Assignment",
  show_less: "Show less",
  active_challenge: "Active Challenge",
     published: "Published",
  all_lessons: "All Lessons",
  search_lessons: "Search lessons...",
  total_lessons: "Total Lessons",
  no_matching_lessons: "No matching lessons found",
  try_changing_criteria: "Try changing your search or filter criteria",
  
  // Задания и работа
  continue_work: "Continue work",
  start_assignment: "Start assignment",
  creating: "Creating",
  accept: "Accept",
  example_code_hint: "Example code hint",
  stats_icon_chart: "📊",
stats_icon_check: "✓",
stats_icon_warning: "⚠",
stats_icon_star: "⭐",
stats_icon_trophy: "🏆",
stats_icon_users: "👥",
stats_icon_activity: "📈",
  
  // Съобщения и дискусии
  message_thread: "Message Thread",
  start_conversation: "Start the conversation by sending a message below",
  type_message: "Type your message...",
  just_now: "Just now",
  all_messages_read: "All messages marked as read!",
  messages_sent: "message(s) sent successfully",
  message_all: "Message All",
  student_wants_to_join: "{student} wants to join '{community}'",
  join_request: "Join Request",
  
  // Управление на уроци
  lesson_updated: "Lesson updated successfully!",
  lesson_created: "Lesson created successfully!",
  error_saving_lesson: "Error saving lesson!",
  confirm_delete_lesson: "Are you sure you want to delete this lesson?",
  lesson_deleted: "Lesson deleted successfully!",
  error_deleting_lesson: "Error deleting lesson!",
  programming: "Programming",
  new_lesson_created: "New lesson created",
  
  // Предизвикателства и общности
  need_community_for_challenges: "You need to create a community before you can create challenges.",
  no_community_selected: "No Community Selected",
  select_community_for_challenges: "Please select a community from the Communities tab to view and manage challenges.",
  go_to_communities: "Go to Communities",
  challenge_sent: "Challenge",
  sent_successfully: "sent successfully",
  
  // Оценяване и обратна връзка
  grade_notification: 'Your work "{file}" has been graded. Points: {points}/10. Feedback: {feedback}',
  grade_assigned: "Grade Assigned",
  grade_assigned_details: 'Assigned {points}/10 points for "{file}"',
  error_saving_grade: "Error saving grade! Check console for details.",
  graded: "graded",
  unknown_student: "Unknown Student",
  
  // Управление на общности
  community_created: "Community created successfully!",
  error_creating_community: "Error creating community!",
  student_approved: "Student approved successfully!",
  error_approving_student: "Error approving student!",
  request_rejected: "Request rejected!",
  error_rejecting_request: "Error rejecting request!",
  id: "ID",
  
  // Активности и действия
  created_expert_system: "Created expert system for biology project",
  uploaded_assignment: "Uploaded assignment file",
  completed_logical_rules: "Completed assignment on logical rules",
    communities: "Communities",
    from: "from",
  my_challenge_solutions: "My Challenge Solutions",
  no_solutions_yet: "No solutions yet",
  join_challenges_to_solve: "Join challenges to start solving!",
  browse_challenges: "Browse Challenges",
  view_solution: "View Solution",
  continue_solving: "Continue Solving",
  message_community: "Message Community",
  message: "Message",
  messages: "Messages",
  type_message_here: "Type message here...",
  select_recipient: "Select recipient",
  teachers: "Teachers",
  message_history: "Message History",
  you: "You",
  no_messages_yet: "No messages yet",
    no_activity: "No activity",
  no_student_activities: "No student activities yet",
  lesson_title_required: "Lesson title is required",

  teacher_pending_approval: "Pending Approval",
  welcome_teacher: "Welcome, Teacher!",
  account_under_review: "Your account is under review",
  admin_approval_needed: "Your account needs to be approved by an administrator before you can access the teacher dashboard.",
  step_1: "Profile Creation",
  profile_created: "Profile created successfully",
  create_profile: "Create teacher profile",
  step_2: "Admin Approval",
  awaiting_admin_approval: "Your account is awaiting administrator approval",
  step_3: "Dashboard Access",
  access_dashboard: "You will gain access to all teacher features",
  your_information: "Your Information",
  full_name: "Full Name",
  email: "Email",
  institution: "School/Institution",
  status: "Status",
  pending_approval: "Pending Approval",
  what_happens_next: "What happens next?",
  step1_description: "The administrator will review your registration",
  step2_description: "You will receive an email when your account is approved",
  step3_description: "After approval you will have full access to the teacher dashboard",
  refresh_status: "Check Status",
  logout: "Logout",
  contact_admin: "Contact Us",
  estimated_approval_time: "Approval usually takes 24-48 hours on business days",

  code_updated: "Code updated",
  upload_error: "Upload error",

  direct_message: "direct_message",
  pending_request: "pending_request",
  
  // Статистики и графики
  total_points: "Total Points",
  last_4_weeks: "Last 4 Weeks",
  grades_trend: "Grades Trend",
  active_students: "Active Students",
  student_activity_chart: "Student Activity Chart",
  activities: "Activities",
  
  // Префикс за потребители (използва се за генериране на потребителски имена)
  user_prefix: "User",
  
  // Основна грешка
  error: "Error",
  
  // Статистики и метрики
  registered_students: "Registered students",
  pending_approvals: "Pending Approvals",
  waiting_for_review: "Waiting for review",
  student_performance: "Student performance",
  lesson_progress: "Lesson Progress",
  completed_lessons: "Completed lessons",
  good_logic: "Good logic structure",
  improve_comments: "Improve comments",
  grade_assignment: "Grade Assignment",
  saving: "Saving...",
  no_file_selected: "No file selected",
  grade_all_work: "Grade All Work",
  my_grades: "My Grades",
  view_all_grades: "View All Grades",
  refresh_grades: "Refresh Grades",
  click_to_view_grades: "Click to view grades",
  see_detailed_grades_feedback: "See all your grades and detailed feedback from teachers",
  open_grades_view: "Open Grades View",
  grades_received: "Grades Received",
  no_grades_yet: "No grades yet",
  complete_assignments_to_get_grades: "Complete assignments to get grades",
  total_grades: "Total Grades",
  average_grade: "Average Grade",
  excellent_grades: "Excellent Grades",
  graded_by: "Graded by",
  recently: "Recently",
  viewing_grade_details: "Viewing Grade Details",
  full_feedback: "Full Feedback",
  score: "Score",
  grade_distribution: "Grade Distribution",
  
  // Заглавия и секции
  student_activities: "Student Activities",
  recent_assignments: "Recent Assignments",
  last_activity: "Last Activity",
  
  // Форми и входни полета
  lesson_title: "Lesson Title",
  enter_lesson_title: "Enter lesson title",
  description: "Description",
  enter_description: "Enter description (optional)",
  
  // Действия и бутони
  add_lesson: "Add Lesson",
  manage_learning_communities: "Manage your learning communities",
  create_community: "Create Community",
  create_first_community: "Create First Community",
  pending_requests: "Pending Requests",
  manage_community_challenges: "Manage and create challenges between communities",
  create_challenge: "Create Challenge",
  create_first_challenge: "Create First Challenge",
  to: "To",
  communities_overview: "Communities Overview",
  no_communities_dashboard: "You haven't created any communities yet",
  view_all_communities: "View All Communities",
  community_name: "Community Name",
  enter_community_name: "Enter community name",
  grade_level: "Grade Level",
  privacy_settings: "Privacy Settings",
  auto_approve_students: "Auto-approve student join requests",
  allow_student_messages: "Allow students to message each other",
  allow_student_challenges: "Allow students to create challenges",
  allow_inter_community_challenges: "Allow inter-community challenges",
  challenge_title: "Challenge Title",
  enter_challenge_title: "Enter challenge title",
  target_community: "Target Community",
  select_community: "Select community",
  send_challenge: "Send Challenge",
  no_messages: "You have no messages",
  mark_all_as_read: "Mark all",
  messages_as_read: "messages as read",
  all_messages_marked_as_read: "All messages marked as read",
  error_updating_messages: "Error updating messages",
  no_read_messages: "You have no read messages",
  delete_read_messages: "Delete read messages",
  read_messages: "read messages",
  messages_deleted: "Messages deleted",
  delete_all_messages: "Delete all messages",
  open_messages: "Open Messages",
    close: "Close",
    download_code: "Download Code",
    download: "Download",
    view_grade: "View Grade",
    view_download_submissions: "View and download your submissions",
    new_submission: "New Submission",
    resubmit: "Resubmit",
    graded_on: "Graded on",
    submitted_on: "Submitted on",
    pending_evaluation: "Pending Evaluation",
    completed: "Completed",
    assignment_not_graded: "This assignment has not been graded yet",
    assignment_evaluation: "Assignment Evaluation",
    code_execution_success: "Code execution success",
    active_streak: "Active Streak",
    consecutive_days_active: "Consecutive days active",
    keep_it_up: "Keep it up!",
    pending_assignments: "Pending",
    needs_submission: "Needs submission or evaluation",
    requires_attention: "Requires attention",
    no_recent_activity: "No recent activity",
      prolog_programming: "Prolog Programming",
    artificial_intelligence: "Artificial Intelligence",
    databases: "Databases",
    algorithms: "Algorithms",
    logic_programming: "Logic Programming",
    about_us:"About us",
  prolog_demo:"Prolog Demo",
    // Заглавия и подзаглавия
    learning_topics: "Learning Topics",
    explore_materials: "Explore educational materials",
    all_topics: "All Topics",
    all_learning_topics: "All Learning Topics",
    explore_category_topics: "Explore category topics",
    browse_all_topics: "Browse all available learning topics",
    topics_completed: "Topics Completed",
    lessons_completed: "Lessons Completed",
    
    // Бърз достъп и менюта
    quick_access: "Quick Access",
    search_topics: "Search topics...",
    categories: "Categories",
    
    // Статуси и действия
    start_learning: "Start Learning",
    start_course: "Start Course",
    start_lesson: "Start Lesson",
    review_lesson: "Review Lesson",
    ask_ai_about_topic: "Ask AI about this topic",
    ask_ai_about_lesson: "Ask AI about this lesson",
    bookmark_lesson: "Bookmark this lesson",
     message_to_all_community: "This message will be sent to everyone in the community",
  message_to_community_members: "This message will be sent to community members",
  no_students_in_community: "No students in this community",
  no_community_members: "No other members in your community",
  teachers_and_my_students: "Teachers and my students",
  community_students: "Community students",
  my_community_members: "My community members",
  community_teacher: "Community Teacher",
  other_teachers: "Other teachers",
  my_students: "My students",
  available_recipients: "Available recipients",
  my_community: "My Community",
  student_messages: "Messages - Student",
  teacher_messages: "Messages - Teacher",
  available_users: "available users",
  broadcast_teachers_only: "Only teachers can broadcast to all students",
  not_your_community: "You cannot send to this community!",
  not_in_community: "You are not in a community!",
  cannot_send_outside_community: "Cannot send messages outside your community",
  cannot_send_to_student: "Students cannot send messages to other students",
  challenge_accept: "Accept the challange",
  challenge_rejected: "Challenge rejected",
  challenge_reject_error: "Error rejecting challenge",
  challenge_accepted: "Challenge accepted",
  challenge_accept_error: "Error accepting challenge",
  no_permission_delete: "You don't have permission to delete this message",
  message_deleted: "Message deleted successfully",
  messages_processed: "Messages processed",
  approve: "Approve",
  reject: "Reject",
  challenge_response_title: "Challenge Response",
  challenge_solution_title: "Challenge Solution",
  challenge_view_solution_code: "View Solution Code",
  challenge_response_from: "Response from",
  challenge_respond: "Respond to Challenge",
  challenge_reject_confirm: "Are you sure you want to reject this challenge?",
  challenge_view_response: "View Response",
  challenge_response_content: "Response Content",
  challenge_response_placeholder: "Write your response here...",
  challenge_solution_code: "Solution Code",
  challenge_solution_code_placeholder: "Write your solution code here...",
  challenge_send_response: "Send Response",
  all_visibility: "All",
    
    // Зареждане и съобщения
    loading_topics: "Loading topics...",
    no_topics_found: "No topics found",
    no_topics_for_category: "There are no topics available for this category yet",
    select_topic_prompt: "Select a topic to view lessons",
    choose_topic_from_list: "Choose a topic from the list to see available lessons",
    no_lessons_available: "No lessons available",
    no_lessons_for_topic: "There are no lessons available for this topic yet",
    
  
    course_lessons: "Course Lessons",
    
    // Prolog Guide
    prolog_guide_subtitle: "Learn logic programming with interactive examples",
    prolog_guide_description: "Prolog is a logic programming language associated with artificial intelligence and computational linguistics. This guide will help you master Prolog programming through practical examples and tutorials.",
    
    // Табове
    tab_basics: "Basics",
    tab_examples: "Examples",
    tab_tutorials: "Tutorials",
    tab_resources: "Resources",
    no_lessons_yet: "No lesson yet",
create_first_lesson: "Create first lesson",
    
    // Основи на Prolog - заглавия
    basics_facts_title: "Facts",
    basics_rules_title: "Rules",
    basics_queries_title: "Queries",
     access_denied: "Access Denied",
  teacher_only: "This area is only accessible to teachers",
  logout_failed: "Logout failed. Please try again.",
  error_loading_lessons: "Error loading lessons",
  error_loading_grades: "Error loading grades",
  error_loading_challenge_stats: "Error loading challenge statistics",
  error_marking_read: "Error marking as read",
  error_marking_all_read: "Error marking all as read",
  error_marking_notifications: "Error updating notifications",
  error_loading_activity: "Error loading activity",
  error_sending_notification: "Error sending notification",
  error_adding_activity: "Error adding activity",
  error_loading_thread: "Error loading message thread",
  error_opening_file: "Error opening file",
  error_downloading_file: "Error downloading file",
  error_details: "Error Details",
  
  // Задания и предизвикателства
  total_challenges: "Total Challenges",
  pending_challenges: "Pending Challenges",
  in_draft: "In Draft",
  no_active_challenges: "No active challenges",
  recent_challenges: "Recent Challenges",
  completion: "Completion",
  avg_score: "Avg. Score",
  respond: "Respond",
  accepted_students: "Accepted Students",
  completed_students: "Completed Students",
  created_by: "Created by",
  no_activity_data: "No activity data available",
  
  // Дни от седмицата (съкратени)
  monday_short: "Mon",
  tuesday_short: "Tue",
  wednesday_short: "Wed",
  thursday_short: "Thu",
  friday_short: "Fri",
  saturday_short: "Sat",
  sunday_short: "Sun",
  
  // Типове нотификации
  assignment_submission: "assignment_submission",
  direct: "direct",
  
  // Нива
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  
  // Общности
  total_communities: "Total Communities",
  new_community: "New Community",
  no_communities: "No communities yet",
  community_activity: "Community Activity",
  no_community_activity: "No community activity",
 
  recent_lessons: "Recent Lessons",
  create_first: "Create First",
  
  // Съобщения и поща
  mailbox: "Mailbox",
  recent_messages: "Recent Messages",
  total_messages: "Total Messages",
  no_files: "No files",
  
  // Студенти
  students_in_system: "Students in System",
  student_list: "Student List",
  all_students: "All Students",
  no_student_data: "No student data available",
  
  // Файлове и качване
  drag_drop: "Drag & drop files here",
  upload: "Upload",
  
  // Основни навигационни секции
  main: "Main",
  learning: "Learning",
  content: "Content",
  activity: "Activity",
  
  // Форми и въвеждане
  name: "Name",
  enter_name: "Enter name",
  
  // Примери
  grade_example: "e.g., 9th Grade",
  subject_example: "e.g., Mathematics",
  
  // Табло и статистики
  dashboard_description: "Overview of your learning activities and progress",
  recent_grades: "Recent Grades",
  no_recent_grades: "No recent grades",
    
    // Основи на Prolog - описания
    basics_facts_desc: "Facts are true statements about the world. They form the foundation of your knowledge base.",
    basics_rules_desc: "Rules define logical relationships between facts. They consist of a head and body.",
    basics_queries_desc: "Queries ask questions about your knowledge base. Prolog tries to prove them true.",
    
    // Основи на Prolog - точки
    basics_facts_p1: "End with a period (.)",
    basics_facts_p2: "Use lowercase for predicates",
    basics_facts_p3: "Can have multiple arguments",
    basics_facts_p4: "Represent relationships",
    all_grades: "All Grades",
evaluation: "Evaluation",
    
    basics_rules_p1: "Head :- Body syntax",
    basics_rules_p2: "Body contains goals",
    basics_rules_p3: "Comma (,) means AND",
    basics_rules_p4: "Semicolon (;) means OR",
    
    basics_queries_p1: "Start with ?- prompt",
    basics_queries_p2: "Variables start uppercase",
    basics_queries_p3: "Get multiple solutions",
    basics_queries_p4: "Use backtracking",
    highest: "Highest",
  high: "High",
  normal: "Normal",
  low: "Low",
  priority: "Priority",
  mountains: "Mountains",
  
  // Статистики и време
  no_grades_data: "No grades data available",
  week_short: "wk",
  hours_ago: "{hours} hours ago",
  days_ago: "{days} days ago",
  this_week: "This Week",
  
  // Съобщения и грешки
  error_pinning_message: "Error pinning message",
  
  // Филтри и обхват
  all_teachers_students: "All Teachers & Students",
  my_community_only: "My Community Only",
  people: "People",
  selected: "Selected",
  unread_only: "Unread Only",
  starred_only: "Starred Only",
  with_attachments: "With Attachments",
  clear_filters: "Clear Filters",
  
  // Състояния на поща
  inbox_empty: "Inbox is empty",
  inbox_empty_desc: "When you receive messages, they will appear here",
  no_messages_desc: "No messages to display",
  write_message: "Write a message",
  message_details: "Message Details",
  read: "Read",
  
  // Действия с messages
  archive: "Archive",
  unarchive: "Unarchive",
  pin: "Pin",
  unpin: "Unpin",
  
  // Прикачени файлове
  attachments: "Attachments",
  add_attachments: "Add Attachments",
  
  // Информация за студенти
  student_notifications_info: "You will receive notifications about your activities here",
  send_message_to: "Send message to {name}",
  
     inbox: "Inbox",
  starred: "Starred",
  sent: "Sent",
  drafts: "Drafts",
  trash: "Trash",
  unknown_user: "User_{0}",
  error_loading_users: "Error loading users",
  error_loading_communities: "Error loading communities",
  error_loading_messages: "Error loading messages",
  attachments_cannot_be_forwarded: "Attachments cannot be forwarded. Please upload them again if needed.",
  unknown: "Unknown",
  no_subject: "No subject",
  login_required: "Please log in!",
  message_content_required: "Please enter message content!",
  recipient_required: "Please select a recipient!",
  recipient_not_found: "Recipient not found!",
  cannot_send_to_self: "You cannot send messages to yourself!",
  community_not_found: "Community not found!",
  no_users_in_community: "No other users in this community!",
  no_other_users: "No other users in the system!",
  invalid_message_type: "Invalid message type!",
  new_message: "New Message",
  you_have_new_message_from: "You have a new message from",
  error_sending_message: "Error sending message",
  no_permission_send_messages: "No permission to send messages. Check Firestore rules!",
  no_internet_connection: "No internet connection. Please try again!",
  try_again: "Please try again.",
  message_sent_to: "Message sent to",
  recipients: "recipients",
  recipient: "recipient",
  error_starring_message: "Error starring message",
  archived: "Archived",
  error_archiving_message: "Error archiving message",
  confirm_delete_message: "Delete this message?",
  message_moved_to_trash: "Message moved to trash!",
  error_deleting_message: "Error deleting message",
  delete_selected_messages: "Delete selected messages",
  selected_messages: "selected messages",
  messages_moved_to_trash: "messages moved to trash",
  error_deleting_messages: "Error deleting messages",
  permanent_delete_confirm: "This message will be permanently deleted. Continue?",
  message_permanently_deleted: "Message permanently deleted!",
  error_permanent_delete: "Error during permanent deletion",
  error_marking_message: "Error marking message",
  no_unread_messages: "No unread messages!",
  messages_marked_as_read: "messages marked as read",
  error_marking_messages: "Error marking messages",
  loading_messages: "Loading messages...",
  messages_center: "Messages Center",
  unread: "unread",
  total: "total",
  in_community: "in community",
  mark_all_read: "Mark all as read",
  mark_all: "Mark all",
  new: "New",
  all: "All",
  community: "Community",
  community_members: "Community members",
  all_users: "All users",
  students: "Students",
  message_to_community: "Message to community",
  user_list: "User list",
  found: "found",
  student: "Student",
  no_users_found: "No users found",
  important: "Important",
  select_all: "Select all",
  delete: "Delete",
  no_new_messages: "No new messages",
  no_messages_found: "No messages found",
  no_messages_inbox: "When you receive messages, they will appear here",
  try_different_folder: "Try a different folder or search",
  me: "Me",
  broadcast: "Broadcast",
  community_message: "Community message",
  broadcast_message: "Broadcast message",
  original_message: "Original message",
  reply: "Reply",
  forwarded_message: "Forwarded message",
  forward: "Forward",
  permanent_delete: "Permanent delete",
  message_to_all: "Message to all",
  message_type: "Message type",
  personal: "Personal",
  sending_to: "Sending to",
  message_to_community_desc: "This message will be sent to all",
  users_on_platform: "users on the platform",
  username_or_email: "Username or email",
  subject: "Subject",
  message_subject: "Message subject",
  write_message_here: "Write your message here...",
  cancel: "Cancel",
  sending: "Sending...",
  send: "Send",
  search_messages: "Search messages...",
  deselect: "Deselect",
  mark_as_read: "Mark as read",
  delete_message: "Delete message",
    
    // Примери на код
    prolog_basics_title: "Prolog Basics",
    prolog_basics_desc: "Facts and Rules in Prolog",
    prolog_basics_expl: "Facts represent true statements. Rules define relationships between facts. Queries ask questions about the knowledge base.",
    
    prolog_recursion_title: "Recursion in Prolog",
    prolog_recursion_desc: "Recursive Rules for Navigation",
    prolog_recursion_expl: "Recursion is essential in Prolog. The ancestor rule calls itself to find indirect relationships.",
    
    prolog_lists_title: "Working with Lists",
    prolog_lists_desc: "List Manipulation in Prolog",
    prolog_lists_expl: "Lists are fundamental data structures in Prolog. They use head-tail notation for recursive processing.",
    bookmark: "Bookmark",
    // Уроци
    tutorial_structure_title: "Program Structure",
    tutorial_structure_content: "Every Prolog program consists of three main parts: facts, rules, and queries. Facts are unconditional truths, rules define logical relationships, and queries ask questions.",
    tutorial_structure_ex1: "Start with simple facts about your domain",
    tutorial_structure_ex2: "Define rules that connect facts logically",
    tutorial_structure_ex3: "Write queries to test your knowledge base",
    tutorial_structure_ex4: "Use comments (%) to document your code",
    
    tutorial_variables_title: "Variables and Unification",
    tutorial_variables_content: "Variables in Prolog start with uppercase letters. Unification is the process of matching variables with values. This is how Prolog finds solutions to queries.",
    tutorial_variables_ex1: "Variables unify with any term",
    tutorial_variables_ex2: "Anonymous variable _ matches anything once",
    tutorial_variables_ex3: "Use same variable to require same value",
    tutorial_variables_ex4: "Variables become instantiated during execution",
    
    tutorial_backtracking_title: "Backtracking and Search",
    tutorial_backtracking_content: "Prolog uses depth-first search with backtracking. When a goal fails, Prolog goes back to the last choice point and tries alternative solutions.",
    tutorial_backtracking_ex1: "Multiple solutions are found one by one",
    tutorial_backtracking_ex2: "Use semicolon (;) to find all solutions",
    tutorial_backtracking_ex3: "Cut (!) prevents backtracking",
    tutorial_backtracking_ex4: "fail forces backtracking",
    
    // Бързи съвети
    quick_tips_title: "Quick Tips for Beginners",
    quick_tips_subtitle: "Essential advice to get started with Prolog",
    tip_1: "Start with simple facts before complex rules",
    tip_2: "Use meaningful predicate names",
    tip_3: "Test each rule independently",
    tip_4: "Read error messages carefully",
    
    // Файлови операции
    view_code_for_domain: "View Code for Domain",
    upload_new_file_to: "Upload New File to",
    
    // Валидация
    name_required: "Please enter your full name",
    institution_required: "Please enter your institution",
    email_required: "Please enter your email",
  
    enter_full_name: "Enter your full name",
    select_role: "Select Your Role",
    teacher_approval_note: "Teacher profiles require admin approval",
    enter_institution: "School/University/Institution",
    grade_course: "Grade/Course",
    enter_grade: "Grade/Course (optional)",
    specialty: "Specialty",
    enter_specialty: "Subject/Specialty (optional)",
    create_password: "Create a password (min. 6 characters)",
    
    // Текстове от интерфейса
    join_community: "Join the",
    register_description: "Start your journey in AI-powered STEM education and explore interactive programming concepts.",
    start_journey: "Start your STEM learning journey today",
    send_updates: "Send me educational resources and updates",
   
    student_account: "Student Account",
practice_makes_perfect: "Practice Makes Perfect",
practice_makes_perfect_desc: "Try solving 3 new Prolog problems this week to improve your skills",
complete_assignments_early: "Complete Assignments Early",
complete_assignments_early_desc: "Submit your work 2 days before deadline for bonus points",
join_study_group: "Join Study Group",
join_study_group_desc: "Collaborate with classmates on complex Prolog projects",
start_now: "Start Now",
view_assignments: "View Assignments",
join_now: "Join Now",
success_rate_trend: "Success Rate Trend",
submit_assignments_projects: "Submit your assignments and projects",
templates: "Templates",
submit_code: "Submit Code",
submissions_found: "submissions found",
check_back_later: "Check back later for new assignments",
all_status: "All Status",
all_difficulty: "All Difficulty",
browse_courses: "Browse Courses",
view_course: "View Course",
continue: "Continue",
track_achievements: "Track your achievements and growth",
uploaded: "Uploaded",
expert_system: "Expert System",
general_knowledge: "General Knowledge",
general_assignment: "General Assignment",
date: "Date",
prolog_submission: "Prolog Submission",
no_submissions_yet: "No submissions yet",
assignments_found: "assignments found",
success: "Success",
    what_to_teach: "What do you want to teach today?",
all_time_submissions: "All time submissions",
completed_submissions: "Completed submissions",
total_files_uploaded: "Total files uploaded",
overall_success_rate: "Overall success rate",
new_today: "New Today",
assignment: "Assignment",
course: "Course",
file: "File",
grading: "Grading",
  // Основни нотификации
  challenge_created_notification: "📢 New challenge \"{title}\" has been created!",
  challenge_accepted_notification: "✅ Challenge \"{title}\" has been accepted!",
  challenge_responded_notification: "💬 Teacher responded to challenge \"{title}\"",
  challenge_completed_notification: "🎉 Challenge \"{title}\" has been completed!",
  challenge_created: "✅ Challenge created for",
  challenge_deleted: "✅ Challenge deleted!",
  
  // Статуси
  responded: "responded",
  rejected: "rejected",
  submitted: "submitted",
  evaluated: "evaluated",
  waiting: "Waiting",
  action_needed: "Action needed",
  done: "Done",
  more: "more",
  
  // Грешки
  error_loading_challenges: "❌ Error loading challenges! Firebase index may be missing.",
  error_accepting_challenge: "❌ Error accepting challenge!",
  error_rejecting_challenge: "❌ Error rejecting challenge!",
  error_creating_challenge: "❌ Error creating challenge!",
  error_sending_response: "❌ Error sending response!",
  error_deleting_challenge: "❌ Error deleting challenge!",
  error_grading_submission: "❌ Error grading submission!",
  
  // Успешни съобщения
  submission_graded: "✅ Submission graded! Challenge completed!",
  response_sent: "✅ Response sent successfully!",
  
  // Нотификации
  your_submission_received: "Your submission for",
  received: "received",
  
  // Форми за предизвикателства
  challenge_will_be_created_for: "Challenge will be created for",
  max_points: "Max points",
  students_accepted: "students accepted",
  students_who_accepted: "Students who accepted this challenge",
  no_submissions_desc: "No students have submitted solutions for this challenge yet.",
  view_submissions: "View submissions",
  grade_submission: "Grade Submission",
  update_grade: "Update Grade",
  solution_code: "Solution Code",
  enter_score: "Enter score",
  provide_feedback: "Provide feedback to the student...",
  
  // Общности
  your_communities: "Your Communities",
  no_community_selected_title: "No Community Selected",
  no_community_selected_desc: "Please select a community from the dropdown above to view and manage challenges.",
  
  // Създаване
  create_first_challenge_for: "Create your first challenge for",
  no_date: "No date",
  deleting: "Deleting...",
  
  // Оценяване
  needs_grading: "⚠️ Needs grading!",
  
  // Валидация
  must_be_logged_in: "❌ You must be logged in!",
  only_creator_can_delete: "❌ Only the creator can delete this challenge!",
  confirm_delete_challenge: "Are you sure you want to delete this challenge?",
  
  // Допълнителни
  challenge_completed: "Challenge Completed!",
  student_accepted: "Student",
ago: "ago",
add_new_assignment: "Add New Assignment",
top_students: "Top Students",
avg: "Avg",
recommendations: "Recommendations",
my_lessons: "My Lessons",
manage_organize_lessons: "Manage and organize your lessons",
add_new_lesson: "Add New Lesson",
preview: "Preview",
manage_create_assignments: "Manage and create new assignments",
add_assignment: "Add Assignment",
upload_first_file: "Upload your first file",
no_email: "No email",
na: "N/A",
 please_login: "Please log in to continue",
no_files_uploaded: "This student hasn't uploaded any files yet.",
add_detailed_feedback: "Add detailed feedback...",
example_expert_system: "Example: Creating an Expert System",
example_insects: "Example: Insects, Chemical Reactions, Electricity",
describe_objective: "Describe the objective of the assignment...",
brief_description: "Brief description of the assignment...",
instructions: "Instructions",
add_instruction: "Add Instruction",
enter_instruction: "Enter instruction...",
minimum_facts: "Minimum Facts",
minimum_rules: "Minimum Rules",
create_new_assignment: "Create New Assignment",
challenge_algorithms: "Algorithm Challenge",
new_course_ml: "New Course: Machine Learning",
select_file_to_grade: "Select file to grade",
student_file_project: "Student File: project.pl",
homework_check: "Homework Check",
visual_examples: "Visual Examples",
visual_examples_desc: "Students respond very well to graphs and diagrams.",
apply: "Apply",
group_work: "Group Work",
group_work_desc: "Start a group task for the next 15 minutes.",
start: "Start",
short_break: "Short Break",
short_break_desc: "Attention is waning - a 2-minute break would help.",
create: "Create",
quick_message: "Quick Message",
  quick_message_desc: "Send a quick message to students or communities",
  open_mail: "Open Mail",
  broadcast_all_students: "Broadcast to All Students",
  type_your_message_here: "Type your message here...",
  new_messages: "New Messages",
  mark_all_read_confirm: "Mark all messages as read?",
  click_to_mark_read: "Click to mark as read",
  view_all_messages: "View All Messages",
    quick_links: 'Quick Links',
schedule_demo: 'Schedule Demo',
explore_community: 'Explore Community',
made_with_love: 'Made with ❤️ for education',
get_started_free: 'Get Started Free',
all_rights_reserved: 'All rights reserved.',
privacy: 'Privacy',
terms: 'Terms',
solved_challenge:'Solved challenge',
new_lesson: "New Lesson",
new_lesson_in: "New lesson in",
code_uploaded: "Code Uploaded",
code_submitted: "Code Submitted",
challenge_solved: "Challenge Solved",
lesson_completed: "Lesson Completed",
completed_lesson: "Completed Lesson",
lessons_to_read: "Lessons to Read",
no_lessons_description: "No lessons available.",
browse_communities: "Browse Communities",
objectives: "Objectives",
read_lesson: "Read Lesson",
no_notifications_description: "No notifications.",
learning_objectives: "Learning Objectives",
prerequisites: "Prerequisites",
lesson_content: "Lesson Content",
tags: "Tags",
mark_as_completed: "Mark as Completed",
    dashboard_schools: "Schools and Users",
dashboard_knowledge: "Knowledge Bases",
dashboard_education: "Educational Materials",
total_schools: "Total Schools",
active_schools_dash: "Active Schools",
registered_users: "Registered Users",
active_users_dash: "Active Users",
classmates: "Classmates",
total_knowledge_bases: "Total Knowledge Bases",
biology_bases: "Biology Bases",
geography_bases: "Geography Bases",
mathematics_bases: "Mathematics Bases",
chemistry_bases: "Chemistry Bases",
physics_bases: "Physics Bases",
history_bases: "History Bases",
literature_bases: "Literature Bases",
language_bases: "Language Bases",
live_status: "LIVE",
schools_short: "Schools",
knowledge_short: "Bases",
education_short: "Materials",
auto_rotate: "Auto rotate",
growth_trend_schools: "Schools Growth Trend",
growth_trend_knowledge: "Knowledge Bases Growth Trend",
growth_trend_education: "Materials Growth Trend",
last_7_days: "Last 7 days",

recent_activity: "Recent Activity",

    lessons: "Lessons",
    prolog: "Prolog",
create_knowledge_title: "Create Knowledge Bases",
create_knowledge_desc: "Create structured knowledge bases from your learning materials and organize information for your classes.",
create_feature_1: "Structuring learning materials",
create_feature_2: "Semantic connections between concepts",
create_feature_3: "Categorization and tagging",
start_creating: "Start Creating",
untitled_assignment: "Untitled Assignment",
  learn_and_practice: "Learn and practice",
  unknown_action: "Unknown action",
  requested_to_join_community: "Requested to join community",
  not_specified: "Not specified",
  submission: "Submission",
  mark_all_as_read_confirm: "Mark all messages as read?",
  symbolic_ai_expert_system: "Symbolic AI / Expert System",
  notifications: "Notifications",
  delete_notification: "Delete notification",
  grades: "Grades",
  rate: "Rate",
  remove_from_favorites: "Remove from favorites",
  add_to_favorites: "Add to favorites",
your_learning_communities: "Your Learning Communities",
join_community_with_code: "Join Community with Code",
lessons_available: "Lessons Available",
no_lessons_found: "No lessons found",
solutions_found: "Solutions Found",
activity_chart: "Activity Chart",
solutions: "Solutions",
  // Communities
  unnamed_community: "Unnamed Community",
  no_description: "No description",
  untitled_challenge: "Untitled Challenge",
  challenge_solution: "Challenge Solution",
  challenge: "Challenge",
  joined_the_challenge: "Joined the challenge",
  submitted_challenge_solution: "Submitted Challenge Solution",
  
  // Messages
  delete_message_error: "Error deleting message",
  delete_all_messages_error: "Error deleting all messages",
  delete_read_messages_confirm: "Delete read messages?",
  delete_unread_messages_confirm: "Delete unread messages?",
  unread_messages: "unread messages",
  delete_messages_error: "Error deleting messages",
  mark_messages_error: "Error marking messages",
  no_messages_from_user: "No messages from this user",
  this_user: "this user",
  delete_messages_from_user_confirm: "Delete all messages from",
  messages_from: "messages from",
  deleted: "deleted",
  
  // Assignments and files
  unknown_assignment: "Unknown Assignment",
  unknown_file: "Unknown file",
  introduction_to_prolog: "Introduction to Prolog",
  excellent_work_prolog: "Excellent work! Your understanding of Prolog basics is solid.",
  expert_systems_design: "Expert Systems Design",
  good_work_detailed_rules: "Good work, but could use more detailed rules.",
  symbol_ai_expert_system: "Symbolic AI / Expert System",
  submitted_prolog_code: "Submitted Prolog code",
  submitted_assignment: "Submitted assignment",
  accepted: "accepted",
  
  // Notifications
  delete_notification_error: "Error deleting notification",
  delete_all_notifications_error: "Error deleting all notifications",
  notification: "Notification",
  work_on_challenges: "Work on Challenges",
  view_template: "View Template",
  
  // Grades
  detailed_view: "Detailed View",
  view_grade_details: "View Grade Details",
  // Common buttons and actions
  delete_all: "Delete All",
   remove_bookmark: "Remove Bookmark",
  like: "Like",
  delete_all_messages_confirm: "Delete all messages?",
  delete_all_notifications_confirm: "Delete all notifications?",
  new_messages_will_appear_here: "New messages will appear here",
  new_notifications_will_appear_here: "New notifications will appear here",
  today: "Today",
  grade_received: "Grade Received",
  system: "System",
  no_notifications: "No notifications",

use_knowledge_title: "Use Knowledge Bases",
use_knowledge_desc: "Search and use already created knowledge bases for your educational projects and research.",
use_feature_1: "Fast search in knowledge bases",
use_feature_2: "Personalized recommendations",
use_feature_3: "Access to the knowledge community",
start_using: "Start Using",
active_creators: "Active Creators",
educational_topics: "Educational Topics",
    choose_assignment: 'Choose an assignment',
     challenge_response_on: "Response on",
  challenge_reject: "Reject Challenge",
use_template: 'Use Template',
assignment_info: 'Assignment Information',
title: 'Title',
requirements: 'Requirements',
file_information: 'File Information',
type: 'Type',
student_name: 'Student Name',
data_area: 'Data Area',
prolog_code: 'Prolog Code',
update_header: 'Update Header',
    review_code: 'Review Code',
start_work: 'Start Work',
select_assignment: 'Please select an assignment first!',
todays_tasks: "Today's Prolog Tasks",
task_details: 'Task Details',
no_tasks_today: 'No assignments for today!',
all_caught_up: "You're all caught up with your Prolog assignments.",
assignment_progress: 'Assignment Progress',
difficulty_distribution: 'Difficulty Distribution',
by_difficulty: 'Assignments by difficulty',
no_active_assignments: 'No active assignments at the moment.',
challenge_not_found: "Challenge not found",
  already_joined_challenge: "You have already joined this challenge",
  select_challenge_first: "Please select a challenge first",
  code_empty: "Code cannot be empty",
  challenge_not_joined: "You have not joined this challenge yet",
  challenge_submitted: "Challenge solution submitted successfully",
  challenge_submission_error: "Error submitting challenge solution",
  select_assignment_first: "Please select an assignment first",
  assignment_not_found: "Assignment not found",
  submit_challenge_solution: "Submit Challenge Solution",
  challenge_mode: "Challenge Mode",
  current_challenge: "Current Challenge",
  challenge_mode_active: "Challenge mode is active",
  exit_challenge_mode: "Exit Challenge Mode",
  no_challenge_selected: "No challenge selected",
  select_challenge_first_desc: "Select a challenge to start solving",
  go_to_challenges: "Go to Challenges",
  switch_to_assignments: "Switch to Assignments",
  switch_to_challenges: "Switch to Challenges",
  submit_solution: "Submit Solution",
facts: 'facts',
rules: 'rules',
review_submission: 'Review Submission',
assignment_completion: 'Assignment Completion',
header_copied: 'Header copied to clipboard!',
copy_header: 'Copy Header',
    status_completed: 'Completed',
status_in_progress: 'In Progress',
    home: 'Home',
    topics: 'Topics',
    dashboard: 'Dashboard',
    prolog_chat: 'Prolog Chat',
    sign_in: 'Sign in',
    get_started: 'Get Started',
    innovation_platform: 'Innovation Platform',
    admin_dashboard: 'Admin Dashboard',
completed_assignments_count: 'Completed Assignments',
in_progress_assignments_count: 'In Progress Assignments',
total_assignments_count: 'Total Assignments',
 unlisted: "Unlisted",
  has_been_published: "Has been published",
  open_in_assignments: "Open in Assignments",
  and_notified: "and notified",
  assignment_created_action: "Assignment Created",
  created_new_assignment: "Created new assignment",
  students_notified: "Students notified",
  overdue_assignments: "Overdue Assignments",
  overdue: "Overdue",
  sort_by_due_date: "Sort by Due Date",
  sort_by_completion: "Sort by Completion",
  sort_by_submissions: "Sort by Submissions",
    // Home page преводи
    ideas_acronym: 'Intelligent Data Educational Analysis System',
    hero_title_part1: 'Transform Education',
    hero_title_part2: 'with AI-Powered Learning',
    hero_description: 'Empower students with logical programming and artificial intelligence concepts through interactive, hands-on STEM projects.',
    view_demos: 'View Demos',
    schools: 'Schools',
    projects: 'Projects',
    features_title_part1: 'Everything you need to teach',
    features_title_part2: 'AI and Logic Programming',
    features_description: 'Comprehensive tools and resources designed specifically for STEM education',
    feature1_title: 'AI-Powered Learning',
    feature1_description: 'Interactive tutorials and intelligent feedback systems that adapt to each student\'s learning pace.',
    feature2_title: 'Real-time Collaboration',
    feature2_description: 'Students work together on projects with live editing and instant feedback.',
    feature3_title: 'Hands-on Projects',
    feature3_description: 'Practical STEM projects that apply logical programming to real-world problems.',
    feature4_title: 'Progress Analytics',
    feature4_description: 'Detailed insights into student performance and learning patterns.',
    feature5_title: 'Curriculum Integration',
    feature5_description: 'Seamlessly fits into existing STEM curricula with ready-to-use lesson plans.',
    feature6_title: 'Industry Ready Skills',
    feature6_description: 'Prepares students for careers in AI, data science, and technology.',
    explore_tools: 'Explore AI Tools',
    start_collaborating: 'Start Collaborating',
    view_projects: 'View Projects',
    see_analytics: 'See Analytics',
    browse_curriculum: 'Browse Curriculum',
    learn_skills: 'Learn Skills',
    demo_title_part1: 'See IDEAS',
    demo_title_part2: 'in Action',
    demo_description: 'Experience how our platform transforms complex programming concepts into engaging, interactive learning experiences that students love.',
    demo_feature1_title: 'Visual Programming Interface',
    demo_feature1_description: 'Drag-and-drop logic blocks for intuitive learning',
    demo_feature2_title: 'Real-time Code Execution',
    demo_feature2_description: 'See results instantly as you write Prolog code',
    demo_feature3_title: 'Interactive Tutorials',
    demo_feature3_description: 'Step-by-step guided learning experiences',
    demo_feature4_title: 'Collaborative Workspace',
    demo_feature4_description: 'Work together with classmates in real-time',
    explore_live_demos: 'Explore Live Demos',
    try_free_tutorial: 'Try Free Tutorial',
    
    // Footer преводи
    footer_description: 'Empowering the next generation of innovators through logical programming and AI education. Transforming STEM learning worldwide.',
    footer_platform: 'Platform',
    footer_support: 'Support',
    help_center: 'Help Center',
    contact_us: 'Contact Us',
    privacy_policy: 'Privacy Policy',
    terms_of_service: 'Terms of Service',
    documentation: 'Documentation',
    submissions: 'Submissions',
    cookies: 'Cookies',
    challenge_view_submissions:"View Submissions",
    // Dashboard преводи (основни)
    welcome_back: 'Welcome back!',
    upload_code: 'Upload Code',
    upload_file: 'Upload File',
    quick_stats: 'Quick Stats',
    total_submissions: 'Total Submissions',
    success_rate: 'Success Rate',
    upload_prolog_code: 'Upload Prolog Code',
    upload_prolog_file: 'Upload Prolog File',
    my_submissions: 'My Submissions',
    active: 'Active',
    no_data: 'No data',
    successful: 'Successful',
    success_rate_small: 'success rate',
    file_uploads: 'File Uploads',
    folders: 'folders',
    prolog_code_editor: 'Prolog Code Editor',
    save_draft: 'Save Draft',
    clear: 'Clear',
    write_prolog_code: 'Write your Prolog code here...',
   
    upload_code_button: 'Upload Code',
    clear_editor: 'Clear Editor',
    upload_success: 'Code uploaded successfully!',
    no_file_user: 'No file selected or user not logged in',
    only_pl_files: 'Only .pl files allowed',
    upload_failed: 'Upload failed:',
    file_upload_success: 'File uploaded successfully!',
    unexpected_error: 'An unexpected error occurred',
    status_success: 'Success',
    status_error: 'Error',
    status_pending: 'Pending',
    select_folder: 'Select Destination Folder:',
    drag_drop_file: 'Drag & drop your .pl file here',
    or_click_browse: 'or click to browse',
    upload_to_folder: 'Upload to',
    clear_selection: 'Clear Selection',
    only_pl_files_info: 'Only .pl files are allowed',
    files_saved_in: 'Files will be saved in:',
    recent_submissions: 'Recent Submissions',
    success_filter: 'Success',
    files_filter: 'Files',
    no_submissions: 'No submissions yet',
    start_uploading: 'Start by uploading your first Prolog code or file!',
    upload_first_code: 'Upload First Code',
    no_code_preview: 'No code preview available...',
    view_details: 'View Details',
    run_again: 'Run Again',
    
    // Нови dashboard преводи
    welcome_subtitle: 'Here\'s your learning progress and upcoming activities',
    search_placeholder: 'Search courses, lessons...',
    learning_platform: 'Learning Platform',
    my_courses: 'My Courses',
    assignments: 'Assignments',
    progress: 'Progress',
    settings: 'Settings',
    learning_progress: 'Learning Progress',
    week: 'Week',
    month: 'Month',
    year: 'Year',
    all_time: 'All Time',
    completion_rate: 'Completion Rate',
    total_study_hours: 'Total Study Hours',
    completed_tasks: 'Completed Tasks',
    streak_days: 'Streak Days',
    progress_over_time: 'Progress Over Time',
    skill_distribution: 'Skill Distribution',
    completed_assignment: 'Completed assignment',
    uploaded_file: 'Uploaded file',
    achieved_milestone: 'Achieved milestone',
    browse_files: 'Browse Files',
    or: 'or',
    students_in_my_communities: "Students in my communities",
  assignments_created_by_me: "Assignments created by me",
  in_system: "In system",
  other_teachers_in_system: "Other teachers in the system",
  my_students_activities: "My Students Activities",
    upload_to: 'Upload to',
    make_first_submission: 'Make your first submission',
    all_assignments: 'All Assignments',
    in_progress: 'In Progress',
    pending: 'Pending',
    due: 'Due',
    tasks: 'tasks',
    details: 'Details',
    continue_learning: 'Continue Learning',
    complete: 'Complete',
    weekly_progress: 'Weekly Progress',
    weekly_completion: 'Weekly completion rate',
    learning_hours: 'Learning Hours',
    daily_study_hours: 'Daily study hours this week',
    my_assignments: 'My Assignments',
    articles: 'Articles',
    view_all: 'View All',
     select_domain_to_view_code:"Choose a knowledge domain to view Prolog code examples",
    // Login page преводи
    login_description: "Continue your journey in AI-powered STEM education and explore interactive programming concepts.",
    access_projects: "Access your projects",
    track_progress: "Track your progress",
    collaborate_peers: "Collaborate with peers",
    sign_in_account: "Sign In to Your Account",
    enter_credentials: "Enter your credentials to continue learning",
    email_address: "Email Address",
    enter_email: "Enter your email",
    password: "Password",
    enter_password: "Enter your password",
    remember_me: "Remember me",
    forgot_password: "Forgot password?",
    signing_in: "Signing In...",
    sign_in_ideas: "Sign In to IDEAS",
    new_to_ideas: "New to IDEAS?",
    create_account: "Create an Account",
    terms_agreement: "By continuing, you agree to our",
    and: "and",
    new_join_request: "You have a new join request for",
    // Register page преводи
    register_title: "Join the IDEAS Community",
    register_journey_title: "Start your STEM learning journey today",
    register_platform_description: "Start your journey in AI-powered STEM education and discover the world of logical programming and artificial intelligence.",
    join_platform: "Join the",
    interactive_tutorials: "Interactive tutorials",
    hands_on_projects: "Hands-on projects",
    collaborative_learning: "Collaborative learning",
    progress_tracking: "Progress tracking",
    create_your_account: "Create Your Account",
    start_stem_journey: "Start your STEM learning journey today",
    confirm_password: "Confirm Password",
    confirm_password_placeholder: "Confirm your password",
    password_placeholder: "Create a password (min. 6 characters)",
    i_agree_to: "I agree to the",
    send_me_updates: "Send me educational resources and updates",
    creating_account: "Creating Account...",
    create_ideas_account: "Create IDEAS Account",
    already_have_account: "Already have an account?",
    sign_in_existing: "Sign In to Existing Account",
    register_footer_text: "By creating an account, you agree to our platform policies and educational guidelines.",
    
    // Validation messages преводи
    password_mismatch: "Passwords don't match",
    password_too_short: "Password should be at least 6 characters",
    password_weak: "Password is too weak",
    email_in_use: "Email already in use",
    invalid_email: "Invalid email address",
    
    // Register success message
    registration_successful: "Registration successful! Welcome to IDEAS.",
    
    // Theme toggle преводи
    switch_to_light: "Switch to light theme",
    switch_to_dark: "Switch to dark theme",
    dark_mode: "Dark Mode",
    light_mode: "Light Mode",
    
    // Нови преводи за липсващите ключове
    what_to_learn: "What to Learn",
    explore_courses: "Explore Courses",
    
    // Нови преводи за PrologChat
    prolog_assistant: 'Prolog AI Assistant',
    domain_based_knowledge: 'Domain-Based Knowledge',
    chat_stats: 'Chat Stats',
    active_domain: 'Active Domain',
    domain: 'Domain',
     in_my_community: "in my community",
  error_loading_community: "Error loading community",
  no_community: "No community",
  remove_star: "Remove star",
  star: "Star",
  select_message: "Select a message",
  select_message_to_view: "Select a message to view details",
  to_community: "to community",
    no_active_domain: 'No Active Domain',
    knowledge_domains: 'Knowledge Domains',
    clear_domain: 'Clear domain',
    clear_chat: 'Clear Chat',
    chat: 'Chat',
    code_preview: 'Code Preview',
    system_commands: 'System Commands',
    file_management: 'File Management',
    enter_filename: 'Enter filename (e.g., animals.pl)',
    file_command_hint: 'Enter filename above, then click a file command',
    responses: 'responses',
    expand_chat: 'Expand chat',
    collapse_chat: 'Collapse chat',
    loading_domain: 'Loading domain',
    domain_loaded_success: 'Domain loaded successfully. Ready for queries.',
    domain_load_error: 'Error loading domain',
    thinking: 'Thinking',
    no_server_response: 'No response from server',
    connection_error: 'Connection error',
    select_domain_first: 'Select a domain first',
    enter_prolog_query: 'Enter Prolog query for',
    press_enter_to_send: 'Press Enter to send',
    queries_end_with_period: 'Make sure queries end with a period (.)',
    connected_to: 'Connected to',
     solution_submitted: "Challenge solution submitted successfully!",
  solution_error: "Error submitting solution",
  join_request_sent: "Join request sent!",
  join_request_error: "Error sending join request",
  invalid_invite_code: "Invalid invite code",
  join_error: "Error joining",
  message_sent: "Message sent successfully!",
  message_error: "Error sending message",
  challenge_joined_success: "Challenge joined! You can now work on your solution.",
  challenge_join_error: "Error joining challenge",
  my_solutions: "My Solutions",
  challenges: "Challenges",
  learning_communities: "Learning communities",
  challenges_in_progress: "Challenges in progress",
  enter_invite_code: "Enter invite code",
  join: "Join",
  my_communities: "My Communities",
  no_communities_yet: "No communities yet",
  join_community_description: "Join existing communities or create your own",
  members: "members",
  public: "Public",
  private: "Private",
  general: "General",
  view_challenges: "View Challenges",
  active_challenges: "Active Challenges",
  no_challenges_yet: "No challenges yet",
  no_challenges_description: "Create your first challenge or wait for others to start one",
  participants: "participants",
  joined: "Joined",
  solve_now: "Solve Now",
  join_challenge: "Join Challenge",
    no_domain_selected: 'No Domain Selected',
    select_domain_to_view: 'Select a domain from the sidebar to view its code files.',
    no_code_files_for: 'No code files for',
    upload_code_for_domain: 'Upload code files for this domain to see them here.',
    files: 'files',
    no_domain: 'No domain',
    copy_code: 'Copy code',
    view_full_code: 'View Full Code',
    api_server: 'API',
    queries: 'Queries',
    code_files: 'Code Files',
    none: 'None',
    animals: 'Animals',
    history: 'History',
    geography: 'Geography',
    mineral_water: 'Mineral Water',
    animal_facts_description: 'Animal facts and relationships',
    historical_facts_description: 'Historical events and figures',
    geographical_facts_description: 'Geographical facts and locations',
    mineral_water_description: 'Mineral water sources and properties',
    help: 'Help',
    load_all: 'Load All',
    list_files: 'List Files',
    clear_facts: 'Clear Facts',
    current_file: 'Current File',
    list_predicates: 'List Predicates',
    unload_all: 'Unload All',
    consult_file: 'Consult File',
    reconsult_file: 'Reconsult File',
    unload_file: 'Unload File',
    switch_file: 'Switch File',
    example_queries: '📚 Example Queries:\n\n',
    
    // Tooltips
    help_tooltip: 'Show help information',
    load_all_tooltip: 'Load all Prolog files',
    list_files_tooltip: 'List all loaded files',
    clear_facts_tooltip: 'Clear all loaded facts',
    current_file_tooltip: 'Show current active file',
    list_predicates_tooltip: 'List all available predicates',
    unload_all_tooltip: 'Unload all Prolog files',
    consult_file_tooltip: 'Load a Prolog file',
    reconsult_file_tooltip: 'Reload a Prolog file',
    unload_file_tooltip: 'Unload a Prolog file',
    switch_file_tooltip: 'Switch to another file',
    
    // Балкан преводи
    balkan: 'Balkan',
    balkan_description: 'Balkan sources and properties',
    central_balkan: 'Central Balkan',
    successful_executions: "Successful executions",
assignments_completed: "Assignments completed",
current_activity_streak: "Current activity streak",
review: "Review",
lines: "lines",
code_editor: "Code Editor",
    // Нови преводи за Header и PrologChat
    file_commands: 'File Commands',
    loading: 'Loading',
    upload_new_file: 'Upload New File',
    drag_drop_file_to_upload: 'Drag & drop .pl file to upload',
    uploading: 'Uploading',
    no_file_user_domain: 'No file selected, user not logged in, or domain not selected',
    uploading_file: 'Uploading file...',
    upload_to_domain: 'Upload to domain',
    code: 'Code',
    file_commands_title: 'File Commands',
  
    class: 'Class',
    average_points: 'Average Points',
    actions: 'Actions',
    grade_saved: 'Grade saved',
    for: 'for',
    feedback_saved: 'Feedback saved successfully!',
    close_window: 'Close Window',
    load_assignments_error: 'Error loading assignments:',
    login_as_teacher: 'Please login as a teacher!',
    assignment_updated: 'Assignment updated successfully!',
    assignment_created: 'Assignment created successfully!',
    save_assignment_error: 'Error saving assignment!',
    assignment_deleted: 'Assignment deleted successfully!',
    confirm_delete_assignment: 'Are you sure you want to delete this assignment?',
    loading_students: 'Loading students...',
    no_access_rights: 'No access rights',
    load_students_error: 'Error loading students:',
    excellent: 'Excellent',
    good: 'Good',
    average: 'Average',
    needs_improvement: 'Needs Improvement',
    poor: 'Poor',
    load_assignments: 'Loading assignments...',
    no_assignments_yet: 'No assignments yet',
    create_first_assignment: 'Create First Assignment',
    edit_assignment: 'Edit Assignment',
    create_assignment: 'Create New Assignment',
    assignment_title: 'Assignment Title',
    assignment_title_placeholder: 'Example: Creating an Expert System',
    topic: 'Topic',
    topic_placeholder: 'Example: Insects, Chemical Reactions, Electricity',
    biology: 'Biology',
    chemistry: 'Chemistry',
    physics: 'Physics',
    other: 'Other',
    due_date: 'Due Date',
    objective: 'Objective',
    objective_placeholder: 'Describe the objective of the assignment...',
    description_placeholder: 'Brief description of the assignment...',
    background_image: 'Background Image',
    category: 'Category',
    minimum_requirements: 'Minimum Requirements',
    min_facts: 'Minimum Facts',
    min_rules: 'Minimum Rules',
    combined_rules: 'Combined Rules',
    menu_items: 'Menu Items',
    difficulty: 'Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    points: 'Points',
    example_code: 'Example Code',
    example_code_placeholder: 'You can provide example Prolog code...',
    optional: 'optional',
    save_changes: 'Save Changes',
    create_articles: 'Create Articles',
    draft: 'Draft',
    edit: 'Edit',
    view: 'View',
    active_assignments: 'Active Assignments',
    total_assignments: 'Total assignments',
    category_statistics: 'Category Statistics',
    assignment_distribution: 'Assignment distribution',
    manage_students_subtitle: 'Review student submissions and assign grades',
    search_students: 'Search students...',
    refresh: 'Refresh',
    export: 'Export',
    filter: 'Filter',
    please_wait: 'Please wait while we fetch student information...',
    no_students_found: 'No Students Found',
    no_students_description: 'No students with uploaded files found in the system.',
    last_upload: 'Last Upload',
    avg_points: 'Avg Points',
    grade: 'Grade',
    view_files: 'View Files',
    send_message: 'Send Message',
    more_options: 'More Options',
    student_files: 'Student Files',
    file_folder: 'Folder',
    file_date: 'Date',
    file_size: 'Size',
    view_code: 'View Code',
    sort_by_rating: "Sort by Rating",
  sort_by_views: "Sort by Views",
  sort_by_date: "Sort by Date",
  
  // Филтри
  all_difficulties: "All Difficulties",
  
  // Статистики
  total_views: "Total Views",
    download_file: 'Download File',
    grade_file: 'Grade This File',
    no_files_found: 'No files found for this student',
    grade_student: 'Grade Student',
    assign_points: 'Assign Points',
    selected_points: 'Selected Points',
    feedback: 'Feedback',
    add_feedback_placeholder: 'Add detailed feedback...',
    excellent_work: 'Excellent Work!',
    needs_correction: 'Needs Correction',
    missing_requirements: 'Missing Requirements',
    creative_solution: 'Creative Solution',
    save_grade: 'Save Grade',
    showing: 'Showing',
    of: 'of',
    showing_of: 'Showing {0} of {1}',
    join_communities: 'Join Communities',
  join_community_dashboard: 'Join communities from dashboard',
  community_join_info: 'After joining communities from dashboard',
  community_creation_note: 'After approval, you can create a community',
  community_creation_help: "You'll be able to create a learning community, invite students, and organize challenges",
    created_new_challenge: "Created new challenge",
has_been_accepted: "Has been accepted",
challenge_response: "Challenge response",
responded_to: "Responded to",
has_been_completed: "Has been completed",
challenge_notification_sent: "Challenge notification sent",
sent_notifications: "Sent notifications",
    // НОВИ КЛЮЧОВЕ ОТ ПОСЛЕДНИЯ АНАЛИЗ:
    teacher_dashboard: 'Teacher Dashboard',
    student_dashboard: 'Student Dashboard',
    teacher: 'Teacher',
    assignment_instructions_1: 'The project must contain:',
    assignment_instructions_2: 'Title section (comments) - subject, topic, student name, class, date',
    assignment_instructions_3: 'Knowledge base (facts) - minimum 20 facts related to the topic',
    assignment_instructions_4: 'Logical rules - minimum 5 rules that derive new information',
    assignment_instructions_5: 'User menu - main predicate start/0, menu with at least 5 choices',
    assignment_instructions_6: 'Working queries - the system must respond correctly',
    delete_assignment_error: 'Error deleting assignment!',
    untitled: 'Untitled',
    no_code: 'No code',
    uncategorized: 'Uncategorized',
    completed_assignments: 'Completed Assignments',
    in_progress_assignments: 'In Progress Assignments',
    
  
    user: 'User',
    message_to_all_desc: 'This message will be sent to all users on the platform',
  },
  bg: {
     // Заглавия на табовете
  "tutorials": "Уроци",
  "videos": "Видеа",
  "puzzles": "Пъзели",
  "extras": "Екстра",
  "examples": "Примери",
  "resources": "Ресурси",
  
  // Типове уроци
  "video": "Видео",
  "puzzle": "Пъзел",
  "extra": "Екстра",
  
  // Съобщения за липса на съдържание
  "no_videos": "Няма налични видеа",
  "no_videos_desc": "Проверете по-късно за видео уроци.",
  "no_puzzles": "Няма налични пъзели",
  "no_puzzles_desc": "Проверете по-късно за пъзели.",
  "no_extras": "Няма налично екстра съдържание",
  "no_extras_desc": "Проверете по-късно за екстра съдържание.",
  "no_lessons": "Няма налични уроци",
  "no_lessons_desc": "Проверете по-късно за нови уроци.",
  
  // Навигация
  "back_to_lessons": "Назад към уроците",
  "previous": "Предишен",
  "next": "Следващ",
  "visit": "Посети",
  "lesson": "Урок",
  
  // Други
  "example": "Пример",
  "output": "Изход",
  "duration": "Продължителност",
  "language": "Език",
  "lessons_videos": "Уроци и видеа",
  "introduction_title": "Въведение в Логическото Програмиране",
  "introduction_description": "Този структуриран курс ще ви преведе през основните концепции на логическото програмиране и Prolog. Всеки урок съчетава теория с практически упражнения.",
  
  // Prolog Guide описания
  "prolog_guide_subtitle": "Овладейте логическото програмиране чрез интерактивни примери",
  "prolog_guide_description": "Prolog е език за логическо програмиране, свързан с изкуствения интелект и компютърната лингвистика. Това изчерпателно ръководство покрива основни концепции чрез практически, реални примери.",
    unlisted: "Непубликуван",
  has_been_published: "Е публикуван",
  open_in_assignments: "Отвори в Заданията",
  and_notified: "и уведомени",
  assignment_created_action: "Заданието е създадено",
  created_new_assignment: "Създаде ново задание",
  students_notified: "Учениците са уведомени",
     user: 'Потребител',
    message_to_all_desc: 'Това съобщение ще бъде изпратено до всички потребители в платформата',
    join_communities: 'Присъединете се към общности',
  join_community_dashboard: 'Присъединете се към общности от таблото',
  community_join_info: 'След като се присъедините към общности от таблото',
  community_creation_note: 'След одобрение можете да създадете общност',
  community_creation_help: 'Ще можете да създадете учебна общност, да каните ученици и да организирате предизвикателства',
  teacher_pending_approval: "Очакване на одобрение",
  welcome_teacher: "Добре дошли, учителю!",
  account_under_review: "Вашият акаунт е в процес на одобрение",
  admin_approval_needed: "Вашият акаунт трябва да бъде одобрен от администратор, преди да получите достъп до учителския панел.",
  step_1: "Създаване на профил",
  profile_created: "Профилът ви е създаден успешно",
  create_profile: "Създаване на учителски профил",
  step_2: "Одобрение от администратор",
  awaiting_admin_approval: "Вашият акаунт чака одобрение от администратор",
  step_3: "Достъп до панела",
  access_dashboard: "Ще получите достъп до всички учителски функции",
  your_information: "Вашата информация",
  full_name: "Име",
  created_new_challenge: "Създаде ново предизвикателство",
has_been_accepted: "Беше прието",
challenge_response: "Отговор на предизвикателство",
responded_to: "Отговори на",
has_been_completed: "Беше завършено",
challenge_notification_sent: "Известие за предизвикателството е изпратено",
sent_notifications: "Изпратени известия",
  email: "Имейл",
  institution: "Училище/Институция",
  status: "Статус",
  pending_approval: "Чака одобрение",
  what_happens_next: "Какво следва?",
  step1_description: "Администраторът ще прегледа вашата регистрация",
  step2_description: "Ще получите имейл, когато акаунтът ви бъде одобрен",
  step3_description: "След одобрение ще имате пълен достъп до учителския панел",
  refresh_status: "Провери статуса",
  logout: "Изход",
  contact_admin: "Свържете се с нас",
  estimated_approval_time: "Одобрението обикновено отнема 24-48 часа в работни дни",
  no_uploads: "Няма качени файлове",
  code_updated: "Кодът е актуализиран",
  upload_error: "Грешка при качване",
  not_pl_file: "Не е Prolog файл",
  upload_successful: "Качването е успешно",
  catch_block_error: "Възникна грешка",
  option: "Опция",
  loading_assignments: "Зареждане на задачи",
  total_students: "Общо ученици",
    what_to_teach: "Какво искате да преподавате днес?",
all_time_submissions: "Всички предавания",
completed_submissions: "Завършени предавания",
total_files_uploaded: "Общо качени файлове",
overall_success_rate: "Общ успех",
new_today: "Най-нови за деня",
assignment: "Задание",
course: "Курс",
file: "Файл",
grading: "Оценяване",
ago: "преди",
add_new_assignment: "Добави ново задание",
challenge_not_found: "Предизвикателството не е намерено",
  already_joined_challenge: "Вече сте се присъединили към това предизвикателство",
  select_challenge_first: "Моля, първо изберете предизвикателство",
  code_empty: "Кодът не може да бъде празен",
  challenge_not_joined: "Все още не сте се присъединили към това предизвикателство",
  challenge_submitted: "Решението на предизвикателството е изпратено успешно",
  challenge_submission_error: "Грешка при изпращане на решението на предизвикателството",
  select_assignment_first: "Моля, първо изберете задача",
  assignment_not_found: "Задачата не е намерена",
  submit_challenge_solution: "Изпрати Решение на Предизвикателството",
  challenge_mode: "Режим на Предизвикателство",
  current_challenge: "Текущо Предизвикателство",
  challenge_mode_active: "Режимът на предизвикателство е активен",
  exit_challenge_mode: "Излез от Режим на Предизвикателство",
  no_challenge_selected: "Няма избрано предизвикателство",
  select_challenge_first_desc: "Изберете предизвикателство, за да започнете решаването",
  go_to_challenges: "Към Предизвикателствата",
  switch_to_assignments: "Превключи към Задачи",
  switch_to_challenges: "Превключи към Предизвикателства",
  submit_solution: "Изпрати Решение",
top_students: "Топ студенти",
challenge_view_submissions:"Вижте решението",
avg: "Средно",
recommendations: "Препоръки",
my_lessons: "Моите уроци",
manage_organize_lessons: "Управлявайте и организирайте вашите уроци",
add_new_lesson: "Добави нов урок",
preview: "Преглед",
manage_create_assignments: "Управлявайте и създавайте нови задания",
add_assignment: "Добави задание",
upload_first_file: "Качете първия си файл",
no_email: "Няма имейл",
na: "Н/П",
no_files_uploaded: "Този ученик все още не е качил файлове.",
add_detailed_feedback: "Добавете подробна обратна връзка...",
example_expert_system: "Пример: Създаване на експертна система",
example_insects: "Пример: Насекоми, химични реакции, електричество",
describe_objective: "Опишете целта на заданието...",
brief_description: "Кратко описание на заданието...",
instructions: "Инструкции",
add_instruction: "Добави инструкция",
enter_instruction: "Въведете инструкция...",
minimum_facts: "Минимални факти",
minimum_rules: "Минимални правила",
create_new_assignment: "Създай ново задание",
challenge_algorithms: "Предизвикателство по Алгоритми",
new_course_ml: "Нов курс: Машинно обучение",
student_file_project: "Файл от ученик: project.pl",
homework_check: "Проверка на домашни",
visual_examples: "Визуални примери",
visual_examples_desc: "Учениците реагират много добре на графики и диаграми.",
apply: "Приложи",
rate: "Оцени",
  remove_from_favorites: "Премахни от любими",
  add_to_favorites: "Добави в любими",
group_work: "Групова работа",
group_work_desc: "Започнете групова задача за следващите 15 минути.",
start: "Започни",
short_break: "Кратка почивка",
short_break_desc: "Вниманието спада – 2-минутна почивка би помогнала.",
create: "Създай",
    quick_links: 'Бързи Връзки',
schedule_demo: 'Запишете Демо',
explore_community: 'Разгледайте Общността',
made_with_love: 'Създадено с ❤️ за образованието',
get_started_free: 'Започнете Безплатно',
all_rights_reserved: 'Всички права запазени.',
    dashboard_schools: "Училища и Потребители",
    new_lesson: "Нов урок",
new_lesson_in: "Нов урок в",
code_uploaded: "Каченият код",
code_submitted: "Изпратеният код",
challenge_solved: "Задачата е решена",
lesson_completed: "Урокът е завършен",
completed_lesson: "Завършен урок",
lessons_to_read: "Уроци за четене",
assignment_submission: "Предаване на задание",
no_lessons_description: "Няма налични уроци.",
browse_communities: "Разгледайте общностите",
objectives: "Цели",
read_lesson: "Прочетете урока",
no_notifications_description: "Няма известия.",
learning_objectives: "Учебни цели",
prerequisites: "Предварителни изисквания",
lesson_content: "Съдържание на урока",
tags: "Етикети",
mark_as_completed: "Маркирай като завършен",
solved_challenge:"Решено задание",
dashboard_knowledge: "Бази Знания",
dashboard_education: "Образователни Материали",
total_schools: "Общо Училища",
active_schools_dash: "Активни Училища",
registered_users: "Регистрирани Потребители",
active_users_dash: "Активни Потребители",
total_knowledge_bases: "Общо Бази Знания",
biology_bases: "Бази по Биология",
geography_bases: "Бази по География",
mathematics_bases: "Бази по Математика",
chemistry_bases: "Бази по Химия",
physics_bases: "Бази по Физика",
history_bases: "Бази по История",
literature_bases: "Бази по Литература",
language_bases: "Бази по Езици",
live_status: "НА ЖИВО",
schools_short: "Училища",
knowledge_short: "Бази",
education_short: "Материали",
auto_rotate: "Автоматично превключване",
growth_trend_schools: "Растеж на училищата",
growth_trend_knowledge: "Растеж на базите знания",
growth_trend_education: "Растеж на материалите",
last_7_days: "Последните 7 дни",
platform_activity: "Активност на платформата",
this_month: "този месец",
data_security: "Сигурност на данните",
recent_activity: "Последна Активност",
activity_new_school: "Ново училище се присъедини",
activity_knowledge_base: "Създадена нова база знания по математика",
activity_new_materials: "Качени нови учебни материали",
activity_user_registered: "Регистрирани 24 нови потребителя",
minutes_ago: "мин",
classmates: "Съученици",
prolog: "Prolog",
lessons: "Уроци",
create_knowledge_title: "Създавайте Бази Знания",
create_knowledge_desc: "Създайте структурирани бази знания от проверени източници и организирайте правилно информацията.",
create_feature_1: "Структуриране на учебни материали",
create_feature_2: "Семантични връзки между концепции",
create_feature_3: "Категоризация и тагове",
start_creating: "Започнете да създавате",

use_knowledge_title: "Използвайте Бази Знания",
use_knowledge_desc: "Търсете и използвайте вече създадени бази знания за вашите образователни проекти и изследвания.",
use_feature_1: "Бързо търсене в базите знания",
use_feature_2: "Персонализирани препоръки",
use_feature_3: "Достъп до общността знания",
start_using: "Започнете да използвате",
active_creators: "Активни създатели",
educational_topics: "Образователни теми",
    choose_assignment: 'Изберете задание',
use_template: 'Използвай шаблон',
assignment_info: 'Информация за заданието',
title: 'Заглавие',
requirements: 'Изисквания',
file_information: 'Информация за файла',
type: 'Тип',
student_name: 'Име на ученика',
data_area: 'Област на данни',
prolog_code: 'Prolog код',
update_header: 'Обнови хедър',
    review_code: 'Преглед на код',
start_work: 'Започни работа',
select_assignment: 'Моля, изберете задание първо!',
todays_tasks: 'Днешните Prolog задачи',
task_details: 'Детайли на задачата',
all_visibility: 'Всички видимости',
no_tasks_today: 'Няма задания за днес!',
all_caught_up: 'Наваксахте с всички Prolog задания.',
assignment_progress: 'Напредък по задания',
difficulty_distribution: 'Разпределение по трудност',
by_difficulty: 'Задания по трудност',
no_active_assignments: 'Няма активни задания в момента.',
facts: 'факта',
rules: 'правила',
review_submission: 'Преглед на подадено',
assignment_completion: 'Завършване на задание',
header_copied: 'Хедърът е копиран в клипборда!',
copy_header: 'Копирай хедър',
    // Header преводи
    status_completed: 'Завършено',
status_in_progress: 'В процес',
    completed_assignments_count: 'Завършени задания',
in_progress_assignments_count: 'Задания в процес',
total_assignments_count: 'Общо задания',
 message_to_all_community: "Това съобщение ще бъде изпратено до всички в общността",
  message_to_community_members: "Това съобщение ще бъде изпратено до членовете на общността",
  no_students_in_community: "Няма ученици в тази общност",
  no_community_members: "Няма други членове в вашата общност",
  teachers_and_my_students: "Учители и мои ученици",
  community_students: "Ученици от общността",
  my_community_members: "Членове на моята общност",
  community_teacher: "Учител на общност",
  other_teachers: "Други учители",
  my_students: "Мои ученици",
  available_recipients: "Налични получатели",
  my_community: "Моята общност",
  student_messages: "Съобщения - Ученик",
  teacher_messages: "Съобщения - Учител",
  available_users: "налични потребители",
  broadcast_teachers_only: "Само учителите могат да изпращат до всички ученици",
  not_your_community: "Не можете да изпращате до тази общност!",
  not_in_community: "Не сте в общност!",
  cannot_send_outside_community: "Не можете да изпращате съобщения извън вашата общност",
  cannot_send_to_student: "Учениците не могат да изпращат съобщения до други ученици",
    home: 'Начало',
    topics: 'Теми',
    dashboard: 'Табло',
    prolog_chat: 'Prolog Чат',
    sign_in: 'Вход',
    get_started: 'Започнете',
    innovation_platform: 'Иновационна платформа',
    admin_dashboard: 'Администраторско табло',
    // Home page преводи
    ideas_acronym: 'Интелигентна система за анализ на образователни бази от знания',
    hero_title_part1: 'Трансформирайте образованието',
    hero_title_part2: 'с изкуствен интелект',
    hero_description: 'Дайте възможност на учениците да изучават логическо програмиране и изкуствения интелект чрез интерактивни, практически STEM проекти.',
    view_demos: 'Вижте демонстрации',
    challenge_rejected: "Предизвикателството е отхвърлено",
  challenge_reject_error: "Грешка при отхвърляне на предизвикателство",
  challenge_accepted: "Предизвикателството е прието",
  challenge_accept_error: "Грешка при приемане на предизвикателство",
  approve: "Одобри",
  reject: "Отхвърли",
   stats_icon_chart: "📊",
stats_icon_check: "✓",
stats_icon_warning: "⚠",
stats_icon_star: "⭐",
stats_icon_trophy: "🏆",
stats_icon_users: "👥",
stats_icon_activity: "📈",
  challenge_response_title: "Отговор на Предизвикателство",
  challenge_solution_title: "Решение на Предизвикателство",
  challenge_view_solution_code: "Виж кода на решението",
  challenge_response_from: "Отговор от",
  challenge_respond: "Отговори на Предизвикателство",
  challenge_reject_confirm: "Сигурни ли сте, че искате да отхвърлите това предизвикателство?",
  challenge_view_response: "Виж Отговор",
  challenge_response_content: "Съдържание на Отговор",
  challenge_response_placeholder: "Напишете вашия отговор тук...",
  challenge_solution_code: "Код на Решението",
  challenge_solution_code_placeholder: "Напишете кода на вашето решение тук...",
  challenge_send_response: "Изпрати Отговор",
   remove_bookmark: "Премахни отметка",
  like: "Харесай",
    // Категории
    prolog_programming: "Програмиране на Prolog",
    artificial_intelligence: "Изкуствен интелект",
    databases: "Бази данни",
    algorithms: "Алгоритми",
    logic_programming: "Логическо програмиране",
    in_my_community: "в моята общност",
  error_loading_community: "Грешка при зареждане на общност",
  no_community: "Няма общност",
  remove_star: "Премахни отметка",
  star: "Отметка",
  select_message: "Изберете съобщение",
  select_message_to_view: "Изберете съобщение, за да видите детайли",
  to_community: "до общност",
  no_messages: "Нямате съобщения",
  mark_all_as_read: "Маркиране на всички",
  messages_as_read: "съобщения като прочетени",
  all_messages_marked_as_read: "Всички съобщения са маркирани като прочетени",
  error_updating_messages: "Грешка при маркиране на съобщения",
  no_read_messages: "Нямате прочетени съобщения",
  delete_read_messages: "Изтрий прочетените",
  read_messages: "прочетени съобщения",
  messages_deleted: "Съобщенията са изтрити",
  delete_all_messages: "Изтрий всички съобщения",
  open_messages: "Отвори Съобщения",
  
    
    // Заглавия и подзаглавия
    learning_topics: "Учебни теми",
    select_file_to_grade: "Изберете файл за оценяване",
    explore_materials: "Разгледайте учебни материали",
    all_topics: "Всички теми",
    all_learning_topics: "Всички учебни теми",
    explore_category_topics: "Разгледайте теми от категорията",
    browse_all_topics: "Разгледайте всички налични учебни теми",
    topics_completed: "Завършени теми",
    lessons_completed: "Завършени уроци",
    no_activity_data: "Няма налични данни за активност",
  
  // Дни от седмицата (съкратени)
  monday_short: "Пон",
  tuesday_short: "Вто",
  wednesday_short: "Сря",
  thursday_short: "Чет",
  friday_short: "Пет",
  saturday_short: "Съб",
  sunday_short: "Нед",
    
    // Бърз достъп и менюта
    quick_access: "Бърз достъп",
    search_topics: "Търсене на теми...",
    categories: "Категории",
     highest: "Най-висок",
  high: "Висок",
  normal: "Нормален",
  low: "Нисък",
  priority: "Приоритет",
  
  // Статистики и време
  no_grades_data: "Няма налични данни за оценки",
  week_short: "седм",
  hours_ago: "преди {hours} часа",
  days_ago: "преди {days} дни",
  this_week: "Тази седмица",
  
  // Съобщения и грешки
  error_pinning_message: "Грешка при закачане на съобщение",
  
  // Филтри и обхват
  all_teachers_students: "Всички учители и ученици",
  my_community_only: "Само моята общност",
  people: "Хора",
  selected: "Избрани",
  unread_only: "Само непрочетени",
  starred_only: "Само със звезда",
  with_attachments: "С прикачени файлове",
  clear_filters: "Изчисти филтрите",
  
  // Състояния на поща
  inbox_empty: "Входящата кутия е празна",
  inbox_empty_desc: "Когато получите съобщения, те ще се появят тук",
  no_messages_desc: "Няма съобщения за показване",
  write_message: "Напишете съобщение",
  message_details: "Детайли на съобщението",
  read: "Прочетено",
  
  // Действия с messages
  archive: "Архивирай",
  unarchive: "Извади от архив",
  pin: "Закачи",
  unpin: "Откачи",
  
  // Прикачени файлове
  attachments: "Прикачени файлове",
  add_attachments: "Добави прикачени файлове",
  
  direct: "direct",
  
  // Информация за студенти
  student_notifications_info: "Тук ще получавате известия за вашите дейности",
  send_message_to: "Изпрати съобщение до {name}",
    
    // Статуси и действия
    start_learning: "Започнете да учите",
    start_course: "Започнете курса",
    start_lesson: "Започнете урока",
    review_lesson: "Прегледайте урока",
    ask_ai_about_topic: "Питайте ИИ за тази тема",
    ask_ai_about_lesson: "Питайте ИИ за този урок",
    bookmark_lesson: "Отбележете урока",
    
    // Зареждане и съобщения
    loading_topics: "Зареждане на теми...",
    no_topics_found: "Няма намерени теми",
    no_topics_for_category: "Все още няма налични теми за тази категория",
    select_topic_prompt: "Изберете тема, за да видите уроците",
    choose_topic_from_list: "Изберете тема от списъка, за да видите наличните уроци",
    no_lessons_available: "Няма налични уроци",
    no_lessons_for_topic: "Все още няма налични уроци за тази тема",
    
    
    course_lessons: "Уроци по курса",
    
    // Prolog Guide
    
    
    // Табове
    tab_basics: "Основи",
    tab_examples: "Примери",
    tab_tutorials: "Уроци",
    tab_resources: "Ресурси",
    continue_work: "Продължи работа",
start_assignment: "Започни задание",
creating: "Създаване",
accept: "Приеми",
example_code_hint: "Подсказка за примерен код",
    
    // Основи на Prolog - заглавия
    basics_facts_title: "Факти",
    basics_rules_title: "Правила",
    basics_queries_title: "Заявки",
     no_permission_delete: "Нямате право да изтриете това съобщение",
  message_deleted: "Съобщението е изтрито успешно",
  messages_processed: "Съобщенията са обработени",
    
    // Основи на Prolog - описания
    basics_facts_desc: "Фактите са истински твърдения за света. Те формират основата на вашата база знания.",
    basics_rules_desc: "Правилата дефинират логически връзки между факти. Те се състоят от глава и тяло.",
    basics_queries_desc: "Заявките задават въпроси за вашата база знания. Prolog се опитва да ги докаже като истинни.",
      challenge_accept: "Приемам предизвикателството",
      challenge_created_notification: "📢 Ново предизвикателство \"{title}\" беше създадено!",
  challenge_accepted_notification: "✅ Предизвикателство \"{title}\" беше прието!",
  challenge_responded_notification: "💬 Учителят отговори на предизвикателство \"{title}\"",
  challenge_completed_notification: "🎉 Предизвикателство \"{title}\" беше завършено!",
  challenge_created: "✅ Предизвикателството е създадено за",
  challenge_deleted: "✅ Предизвикателството е изтрито!",
  
  // Статуси
  responded: "отговорено",
  rejected: "отхвърлено",
  submitted: "предадено",
  evaluated: "оценено",
  waiting: "Чака",
  action_needed: "Нужно действие",
  done: "Готово",
  more: "още",
   new_challenge: "Ново предизвикателство",
  new_challenge_notification: "Ново предизвикателство",
  new_challenge_available: "Налично е ново предизвикателство",
  new_assignment_notification: "Нова задача",
  loading_solutions: "Зареждане на вашите решения...",
  challenge_id: "ID на предизвикателството",
  challenge_not_loaded: "Предизвикателството не е заредено",
  solution_status: "Статус на решението",
  your_grade: "Вашата оценка",
  view_feedback: "Вижте обратната връзка",
  evaluated_by: "Оценено от",
  code_copied: "Кодът е копиран в клипборда!",
  no_code_to_copy: "Няма код за копиране",
  your_name: "Вашето име",
  new_assignment: "Нова задача",
  show_less: "Покажи по-малко",
  active_challenge: "Активно предизвикателство",
  all_grades: "Всички оценки",
evaluation: "Оценяване",
bookmark: "Отметка",
  
  // Грешки
  error_loading_challenges: "❌ Грешка при зареждане на предизвикателства! Вероятно липсва Firebase индекс.",
  error_accepting_challenge: "❌ Грешка при приемане на предизвикателство!",
  error_rejecting_challenge: "❌ Грешка при отхвърляне на предизвикателство!",
  error_creating_challenge: "❌ Грешка при създаване на предизвикателство!",
  error_sending_response: "❌ Грешка при изпращане на отговор!",
  error_deleting_challenge: "❌ Грешка при изтриване на предизвикателство!",
  error_grading_submission: "❌ Грешка при оценяване на решение!",
  
  // Успешни съобщения
  submission_graded: "✅ Решението е оценено! Предизвикателството е завършено!",
  response_sent: "✅ Отговорът е изпратен успешно!",
  
  // Нотификации
  your_submission_received: "Вашето решение за",
  received: "получи",
  
  // Форми за предизвикателства
  challenge_will_be_created_for: "Предизвикателството ще бъде създадено за",
  max_points: "Макс. точки",
  students_accepted: "приели ученици",
  students_who_accepted: "Ученици, които приеха предизвикателството",
  no_submissions_desc: "Все още никой ученик не е предал решение за това предизвикателство.",
  view_submissions: "Преглед на решения",
  grade_submission: "Оцени решение",
  update_grade: "Актуализирай оценка",
  solution_code: "Код на решението",
  enter_score: "Въведете резултат",
  provide_feedback: "Предоставете обратна връзка на ученика...",
  
  // Общности
  your_communities: "Вашите общности",
  no_community_selected_title: "Няма избрана общност",
  no_community_selected_desc: "Моля, изберете общност от падащото меню, за да видите и управлявате предизвикателства.",
  
  // Създаване
  create_first_challenge_for: "Създайте първото си предизвикателство за",
  no_date: "Без дата",
  deleting: "Изтриване...",
  
  // Оценяване
  needs_grading: "⚠️ Нуждае се от оценяване!",
  
  // Валидация
  must_be_logged_in: "❌ Трябва да сте влезли в профила си!",
  only_creator_can_delete: "❌ Само създателят може да изтрие това предизвикателство!",
  confirm_delete_challenge: "Сигурни ли сте, че искате да изтриете това предизвикателство?",
  
  // Допълнителни
  challenge_completed: "Предизвикателството е завършено!",
  student_accepted: "Ученик",
  grades: "Оценки",
your_learning_communities: "Вашите учебни общности",
join_community_with_code: "Присъединете се с код",
lessons_available: "Налични уроци",
no_lessons_found: "Няма намерени уроци",
solutions_found: "Намерени решения",
activity_chart: "Графика на активността",
solutions: "Решения",
    // Основи на Prolog - точки
    basics_facts_p1: "Завършват с точка (.)",
    basics_facts_p2: "Използвайте малки букви за предикати",
    basics_facts_p3: "Могат да имат множество аргументи",
    basics_facts_p4: "Представляват връзки",
     solution_submitted: "Решението на предизвикателството е изпратено успешно!",
  solution_error: "Грешка при изпращане на решение",
  join_request_sent: "Заявката за присъединяване е изпратена!",
  join_request_error: "Грешка при изпращане на заявка за присъединяване",
  invalid_invite_code: "Невалиден код за покана",
  join_error: "Грешка при присъединяване",
  message_sent: "Съобщението е изпратено успешно!",
  message_error: "Грешка при изпращане на съобщение",
  challenge_joined_success: "Предизвикателството е присъединено! Вече можете да работите по вашето решение.",
  challenge_join_error: "Грешка при присъединяване към предизвикателство",
  my_solutions: "Моите Решения",
  challenges: "Предизвикателства",
  learning_communities: "Учебни общности",
  challenges_in_progress: "Предизвикателства в процес",
  enter_invite_code: "Въведете код за покана",
  join: "Присъединете се",
  my_communities: "Моите Общности",
  no_communities_yet: "Все още няма общности",
  join_community_description: "Присъединете се към съществуващи общности или създайте своя собствена",
  members: "членове",
  public: "Публична",
  private: "Частна",
  general: "Общ",
  view_challenges: "Вижте Предизвикателства",
  community_members: "Членове на Общността",
  active_challenges: "Активни Предизвикателства",
  no_challenges_yet: "Все още няма предизвикателства",
  no_challenges_description: "Създайте първото си предизвикателство или изчакайте други да започнат",
  participants: "участници",
  joined: "Присъединен",
  solve_now: "Реши Сега",
  join_challenge: "Присъедини се към Предизвикателство",
  
    
    basics_rules_p1: "Синтаксис Глава :- Тяло",
    basics_rules_p2: "Тялото съдържа цели",
    basics_rules_p3: "Запетаята (,) означава И",
    basics_rules_p4: "Точка и запетая (;) означава ИЛИ",
    
    basics_queries_p1: "Започват със символа ?-",
    basics_queries_p2: "Променливите започват с главна буква",
    basics_queries_p3: "Получавайте множество решения",
    basics_queries_p4: "Използвайте backtracking",
    
    // Примери на код
    prolog_basics_title: "Основи на Prolog",
    prolog_basics_desc: "Факти и Правила в Prolog",
    prolog_basics_expl: "Фактите представляват истински твърдения. Правилата дефинират връзки между факти. Заявките задават въпроси за базата знания.",
    
    prolog_recursion_title: "Рекурсия в Prolog",
    prolog_recursion_desc: "Рекурсивни правила за навигация",
    prolog_recursion_expl: "Рекурсията е съществена в Prolog. Правилото за предшественик се извиква себе си, за да намери косвени връзки.",
    
    prolog_lists_title: "Работа със списъци",
    prolog_lists_desc: "Манипулация на списъци в Prolog",
    prolog_lists_expl: "Списъците са фундаментални структури от данни в Prolog. Използват нотация глава-опашка за рекурсивна обработка.",
    
    // Уроци
    tutorial_structure_title: "Структура на програмата",
    tutorial_structure_content: "Всяка Prolog програма се състои от три основни части: факти, правила и заявки. Фактите са безусловни истини, правилата дефинират логически връзки, а заявките задават въпроси.",
    tutorial_structure_ex1: "Започнете с прости факти за вашия домейн",
    tutorial_structure_ex2: "Дефинирайте правила, които свързват факти логически",
    tutorial_structure_ex3: "Напишете заявки, за да тествате вашата база знания",
    tutorial_structure_ex4: "Използвайте коментари (%) за документиране на кода",
    
    tutorial_variables_title: "Променливи и унификация",
    tutorial_variables_content: "Променливите в Prolog започват с главни букви. Унификацията е процесът на съпоставяне на променливи със стойности. Така Prolog намира решения на заявки.",
    tutorial_variables_ex1: "Променливите се унифицират с всеки термин",
    tutorial_variables_ex2: "Анонимната променлива _ съвпада с всичко веднъж",
    tutorial_variables_ex3: "Използвайте същата променлива, за да изисквате една и съща стойност",
    tutorial_variables_ex4: "Променливите се инстанцират по време на изпълнение",
    no_lessons_yet: "Няма добавени уроци",
create_first_lesson: "Създай първият си урок",
    inbox: "Входящи",
  starred: "Отметнати",
  sent: "Изпратени",
  drafts: "Чернови",
  trash: "Кошче",
  unknown_user: "User_{0}",
  error_loading_users: "Грешка при зареждане на потребители",
  error_loading_communities: "Грешка при зареждане на общности",
  error_loading_messages: "Грешка при зареждане на съобщения",
  unknown: "Неизвестен",
  no_subject: "Без тема",
  login_required: "Моля, влезте в профила си!",
  message_content_required: "Моля, въведете съдържание на съобщението!",
  recipient_required: "Моля, изберете получател!",
  recipient_not_found: "Получателят не е намерен!",
  cannot_send_to_self: "Не можете да изпращате съобщения до себе си!",
  select_community: "Изберете общност",
  community_not_found: "Общността не е намерена!",
  no_users_in_community: "Няма други потребители в тази общност!",
  no_other_users: "Няма други потребители в системата!",
  invalid_message_type: "Невалиден тип съобщение!",
  new_message: "Ново съобщение",
  you_have_new_message_from: "Имате ново съобщение от",
  error_sending_message: "Грешка при изпращане на съобщение",
  no_permission_send_messages: "Няма разрешение за изпращане на съобщения. Проверете Firestore правилата!",
  no_internet_connection: "Няма интернет връзка. Моля, опитайте отново!",
  try_again: "Моля, опитайте отново.",
  message_sent_to: "Съобщението е изпратено до",
  recipients: "получатели",
  recipient: "получател",
  error_starring_message: "Грешка при отметване на съобщение",
  archived: "Архивирано",
  error_archiving_message: "Грешка при архивиране на съобщение",
  confirm_delete_message: "Изтриване на това съобщение?",
  message_moved_to_trash: "Съобщението е преместено в кошчето!",
  error_deleting_message: "Грешка при изтриване на съобщение",
  delete_selected_messages: "Изтриване на избрани съобщения",
  selected_messages: "избрани съобщения",
  messages_moved_to_trash: "съобщения са преместени в кошчето",
  error_deleting_messages: "Грешка при изтриване на съобщения",
  permanent_delete_confirm: "Това съобщение ще бъде изтрито завинаги. Продължавате?",
  message_permanently_deleted: "Съобщението е изтрито окончателно!",
  error_permanent_delete: "Грешка при окончателно изтриване",
  error_marking_message: "Грешка при маркиране на съобщение",
  no_unread_messages: "Няма непрочетени съобщения!",
  messages_marked_as_read: "съобщения са маркирани като прочетени",
  error_marking_messages: "Грешка при маркиране на съобщения",
  loading_messages: "Зареждане на съобщения...",
  messages_center: "Съобщения",
  unread: "непрочетени",
  total: "общо",
  in_community: "в общност",
  mark_all_read: "Маркирай всички като прочетени",
  mark_all: "Маркирай всички",
  new: "Ново",
  all: "Всички",
  community: "Общност",
  all_users: "Всички потребители",
  teachers: "Учители",
  students: "Ученици",
  message_to_community: "Съобщение до общността",
  user_list: "Списък с потребители",
  found: "намерени",
  student: "Ученик",
  no_users_found: "Няма намерени потребители",
  important: "Важно",
  select_all: "Избери всички",
  attachments_cannot_be_forwarded: "Прикачените файлове не могат да бъдат препратени. Моля, качете ги отново ако е необходимо.",
  delete: "Изтрий",
  no_new_messages: "Нямате нови съобщения",
  no_messages_found: "Няма намерени съобщения",
  no_messages_inbox: "Когато получите съобщения, те ще се появят тук",
  try_different_folder: "Опитайте с различна папка или търсене",
  access_denied: "Достъпът е отказан",
  teacher_only: "Тази област е достъпна само за учители",
  logout_failed: "Изходът е неуспешен. Моля, опитайте отново.",
  error_loading_lessons: "Грешка при зареждане на уроците",
  error_loading_grades: "Грешка при зареждане на оценките",
  error_loading_challenge_stats: "Грешка при зареждане на статистиките за предизвикателства",
  error_marking_read: "Грешка при маркиране като прочетено",
  error_marking_all_read: "Грешка при маркиране на всички като прочетени",
  error_marking_notifications: "Грешка при обновяване на известията",
  error_loading_activity: "Грешка при зареждане на активността",
  error_sending_notification: "Грешка при изпращане на известие",
  error_adding_activity: "Грешка при добавяне на активност",
  error_loading_thread: "Грешка при зареждане на нишката от съобщения",
  error_opening_file: "Грешка при отваряне на файл",
  error_downloading_file: "Грешка при изтегляне на файл",
  error_details: "Детайли за грешката",
  new_join_request: "Нова заявка за присъединяване",
  // Задания и предизвикателства
  total_challenges: "Общо предизвикателства",
  pending_challenges: "Чакащи предизвикателства",
  in_draft: "В чернова",
  no_active_challenges: "Няма активни предизвикателства",
  recent_challenges: "Скорошни предизвикателства",
  completion: "Завършване",
  avg_score: "Ср. успех",
  respond: "Отговори",
  accepted_students: "Приели ученици",
  completed_students: "Завършили ученици",
  created_by: "Създадено от",
  
  // Нива
  beginner: "Начинаещ",
  intermediate: "Средно ниво",
  advanced: "Напреднал",
  
  // Общности
  total_communities: "Общо общности",
  new_community: "Нова общност",
  no_communities: "Все още няма общности",
  community_activity: "Активност в общността",
  no_community_activity: "Няма активност в общността",
  
  // Уроци
 
  recent_lessons: "Скорошни уроци",
  create_first: "Създай първи",
  
  // Съобщения и поща
  mailbox: "Пощенска кутия",
  recent_messages: "Скорошни съобщения",
  total_messages: "Общо съобщения",
  no_files: "Няма файлове",
  
  // Студенти
  students_in_system: "Ученици в системата",
  student_list: "Списък с ученици",
  all_students: "Всички ученици",
  no_student_data: "Няма налични данни за ученици",
  
  // Файлове и качване
  drag_drop: "Плъзнете и пуснете файлове тук",
  upload: "Качи",
  
  // Основни навигационни секции
  main: "Основно",
  learning: "Обучение",
  content: "Съдържание",
  activity: "Активност",
  
  // Форми и въвеждане
  name: "Име",
  enter_name: "Въведете име",
  
  // Примери
  grade_example: "напр., 9 клас",
  subject_example: "напр., Математика",
  
  // Табло и статистики
  dashboard_description: "Преглед на вашите учебни дейности и напредък",
  recent_grades: "Скорошни оценки",
  no_recent_grades: "Няма скорошни оценки",
  me: "Аз",
  broadcast: "Всички",
  community_message: "Съобщение до общност",
  broadcast_message: "Съобщение до всички",
  original_message: "Оригинално съобщение",
  reply: "Отговор",
  forwarded_message: "Препратено съобщение",
  forward: "Препрати",
  permanent_delete: "Изтрий окончателно",
  message_to_all: "Съобщение до всички",
  message_type: "Тип съобщение",
  personal: "Лично",
  sending_to: "Изпращане до",
  message_to_community_desc: "Това съобщение ще бъде изпратено до всички",
  users_on_platform: "потребители в платформата",
  username_or_email: "Име на потребител или имейл",
  subject: "Тема",
  message_subject: "Тема на съобщението",
  write_message_here: "Напишете съобщението си тук...",
  cancel: "Отказ",
  sending: "Изпращане...",
  send: "Изпрати",
  search_messages: "Търсене на съобщения...",
  deselect: "Отмени",
  mark_as_read: "Маркирай като прочетено",
  delete_message: "Изтрий съобщение",
  message: "Съобщение",
  to: "до",
  students_in_my_communities: "Ученици в моите общности",
  assignments_created_by_me: "Задания, създадени от мен",
  in_system: "В системата",
  other_teachers_in_system: "Други учители в системата",
  my_students_activities: "Активности на моите ученици",
    
    tutorial_backtracking_title: "Backtracking и търсене",
    tutorial_backtracking_content: "Prolog използва търсене в дълбочина с backtracking. Когато цел не успее, Prolog се връща до последната точка на избор и опитва алтернативни решения.",
    tutorial_backtracking_ex1: "Намират се множество решения едно по едно",
    tutorial_backtracking_ex2: "Използвайте точка и запетая (;), за да намерите всички решения",
    tutorial_backtracking_ex3: "Cut (!) предотвратява backtracking",
    tutorial_backtracking_ex4: "fail принуждава backtracking",
    
    // Бързи съвети
    quick_tips_title: "Бързи съвети за начинаещи",
    quick_tips_subtitle: "Съществени съвети за започване с Prolog",
    tip_1: "Започнете с прости факти преди сложни правила",
    tip_2: "Използвайте смислени имена на предикати",
    tip_3: "Тествайте всяко правило независимо",
    tip_4: "Четете внимателно съобщенията за грешки",
    
    // Файлови операции
    view_code_for_domain: "Виж код за домейн",
    upload_new_file_to: "Качи нов файл в",
    
    // Валидация
    name_required: "Моля, въведете вашето пълно име",
    institution_required: "Моля, въведете вашата институция",
    email_required: "Моля, въведете вашия имейл",
    enter_full_name: "Въведете вашето пълно име",
    select_role: "Изберете Вашата Роля",
    teacher_approval_note: "Профилите на учители изискват одобрение от администратор",
    enter_institution: "Училище/Университет/Институция",
    grade_course: "Клас/Курс",
    enter_grade: "Клас/Курс (незадължително)",
    specialty: "Специалност",
    enter_specialty: "Предмет/Специалност (незадължително)",
    create_password: "Създайте парола (мин. 6 символа)",
    
    // Текстове от интерфейса
    join_community: "Присъединете се към",
    register_description: "Започнете вашето пътешествие в STEM образованието, задвижвано от ИИ, и разгледайте интерактивни програмни концепции.",
    start_journey: "Започнете вашето STEM учебно пътешествие днес",
    send_updates: "Изпращайте ми образователни ресурси и актуализации",
    schools: 'Училища',
    projects: 'Проекти',
    features_title_part1: 'Всичко необходимо за обучение',
    features_title_part2: 'по AI и логическо програмиране',
    features_description: 'Цялостни инструменти и ресурси, създадени специално за STEM образованието',
    feature1_title: 'Обучение с AI',
    feature1_description: 'Интерактивни уроци и интелигентни системи за обратна връзка, които се адаптират към темпото на всеки ученик.',
    feature2_title: 'Съвместна работа в реално време',
    feature2_description: 'Учениците работят заедно по проекти с възможност за редакции в реално време и незабавна обратна връзка.',
    feature3_title: 'Практически проекти',
    feature3_description: 'Практически STEM проекти, които прилагат логическо програмиране в реални проблеми.',
    feature4_title: 'Анализ на напредъка',
    feature4_description: 'Подробни анализи на представянето и моделите на учене на учениците.',
    feature5_title: 'Интеграция в учебния план',
    feature5_description: 'Безпроблемно се вписва в съществуващите STEM учебни програми с готови за използване планове за уроци.',
    feature6_title: 'Навыци за индустрията',
    feature6_description: 'Подготвя учениците за кариери в AI, науката за данните и технологиите.',
    explore_tools: 'Разгледайте AI инструментите',
    start_collaborating: 'Започнете съвместна работа',
    view_projects: 'Вижте проектите',
    see_analytics: 'Вижте анализите',
    browse_curriculum: 'Разгледайте учебната програма',
    learn_skills: 'Научете умения',
    demo_title_part1: 'Вижте IDEAS',
    demo_title_part2: 'в действие',
    untitled_assignment: "Задание без заглавие",
  learn_and_practice: "Учене и практика",
  unknown_action: "Неизвестно действие",
  requested_to_join_community: "Заявено присъединяване към общност",
  not_specified: "Не е указано",
  submission: "Подаване",
  mark_all_as_read_confirm: "Маркирай всички съобщения като прочетени?",
  symbolic_ai_expert_system: "Символен AI / Експертна система",
  notifications: "Нотификации",
  delete_notification: "Изтрий нотификация",
  
  // Communities
  unnamed_community: "Общност без име",
  no_description: "Няма описание",
  untitled_challenge: "Предизвикателство без заглавие",
  challenge_solution: "Решение на предизвикателство",
  challenge: "Предизвикателство",
  joined_the_challenge: "Присъедини се към предизвикателството",
  submitted_challenge_solution: "Изпратено решение на предизвикателство",
  
  // Messages
  delete_message_error: "Грешка при изтриване на съобщението",
  delete_all_messages_error: "Грешка при изтриване на всички съобщения",
  delete_read_messages_confirm: "Изтрий прочетените съобщения?",
  delete_unread_messages_confirm: "Изтрий непрочетените съобщения?",
  unread_messages: "непрочетени съобщения",
  delete_messages_error: "Грешка при изтриване на съобщения",
  mark_messages_error: "Грешка при маркиране на съобщения",
  no_messages_from_user: "Няма съобщения от този потребител",
  this_user: "този потребител",
  delete_messages_from_user_confirm: "Изтрий всички съобщения от",
  messages_from: "съобщения от",
  deleted: "изтрити",
  challenge_sent: "challenge_sent",
  direct_message: "direct_message",
  pending_request: "pending_request",
  
  // Статистики и графики
  total_points: "Общо точки",
  last_4_weeks: "Последните 4 седмици",
  grades_trend: "Тенденция на оценките",
  active_students: "Активни ученици",
  student_activity_chart: "Графика на активността на учениците",
  activities: "Дейности",
  
  // Префикс за потребители
  user_prefix: "Потребител",
   sort_by_rating: "Сортирай по рейтинг",
  sort_by_views: "Сортирай по прегледи",
  sort_by_date: "Сортирай по дата",
  
  // Филтри
  all_difficulties: "Всички нива на трудност",
  
  // Статистики
  total_views: "Общо прегледи",
  
  // Основна грешка
  error: "Грешка",
  
  // Assignments and files
  unknown_assignment: "Непознато задание",
  unknown_file: "Непознат файл",
  introduction_to_prolog: "Въведение в Prolog",
  excellent_work_prolog: "Отлична работа! Разбирането ви за основите на Prolog е солидно.",
  expert_systems_design: "Дизайн на експертни системи",
  good_work_detailed_rules: "Добра работа, но биха помогнали по-детайлни правила.",
  symbol_ai_expert_system: "Символен AI / Експертна система",
  submitted_prolog_code: "Изпратен Prolog код",
  submitted_assignment: "Изпратено задание",
  accepted: "приети",
  
  // Notifications
  delete_notification_error: "Грешка при изтриване на нотификация",
  delete_all_notifications_error: "Грешка при изтриване на всички нотификации",
  notification: "Нотификация",
  work_on_challenges: "Работа по предизвикателства",
  
  // Grades
  detailed_view: "Детайлен изглед",
  view_grade_details: "Виж детайли на оценката",
  
  // Common buttons and actions
  delete_all: "Изтрий всички",
  delete_all_messages_confirm: "Изтрий всички съобщения?",
  delete_all_notifications_confirm: "Изтрий всички нотификации?",
  new_messages_will_appear_here: "Новите съобщения ще се появят тук",
  new_notifications_will_appear_here: "Новите нотификации ще се появят тук",
  today: "Днес",
  grade_received: "Получена оценка",
  system: "Система",
  no_notifications: "Няма нотификации",
    demo_description: 'Изживейте как нашата платформа трансформира сложните програмни концепции в ангажиращи, интерактивни учебни преживявания, които учениците обичат.',
    demo_feature1_title: 'Визуален интерфейс за програмиране',
    demo_feature1_description: 'Плъзгане и пускане на логически блокове за интуитивно учене',
    demo_feature2_title: 'Изпълнение на код в реално време',
    demo_feature2_description: 'Вижте резултатите моментално, докато пишете Prolog код',
    demo_feature3_title: 'Интерактивни уроци',
    demo_feature3_description: 'Уроци с ръководство стъпка по стъпка',
    demo_feature4_title: 'Съвместно работно пространство',
    demo_feature4_description: 'Работете заедно със съученици в реално време',
    explore_live_demos: 'Разгледайте живи демонстрации',
    try_free_tutorial: 'Опитайте безплатен урок',
    secure_login: "Сигурен & Криптиран",
    security_description: "Вашите данни са защитени с крайно-крайно криптиране",
    // Footer преводи
    footer_description: 'Даваме възможност на следващото поколение иноватори чрез логическо програмиране и AI образование. Трансформираме STEM образованието по целия свят.',
    footer_platform: 'Платформа',
    footer_support: 'Поддръжка',
    help_center: 'Център за помощ',
    contact_us: 'Свържете се с нас',
    privacy_policy: 'Политика за поверителност',
    terms_of_service: 'Условия за ползване',
    documentation: 'Документация',
    submissions: 'Подадени материали',
    privacy: 'Поверителност',
    terms: 'Условия',
    cookies: 'Бисквитки',
    communities: "Общности",
    
    // Dashboard преводи (основни)
    welcome_back: 'Добре дошли отново!',
    upload_code: 'Качване на код',
    upload_file: 'Качване на файл',
    quick_stats: 'Бърза статистика',
    total_submissions: 'Общо подадени',
    success_rate: 'Процент на успех',
    upload_prolog_code: 'Качване на Prolog код',
    upload_prolog_file: 'Качване на Prolog файл',
    my_submissions: 'Моите подадени материали',
     good_logic: "Добра логическа структура",
  improve_comments: "Подобряване на коментарите",
  grade_assignment: "Оцени Задача",
  saving: "Запазване...",
  no_file_selected: "Няма избран файл",
  grade_all_work: "Оцени Всички Работи",
  my_grades: "Моите Оценки",
  view_all_grades: "Виж Всички Оценки",
  refresh_grades: "Обнови Оценките",
  click_to_view_grades: "Кликнете за преглед на оценките",
  see_detailed_grades_feedback: "Вижте всички ваши оценки и подробна обратна връзка от учителите",
  open_grades_view: "Отвори Преглед на Оценките",
  grades_received: "Получени Оценки",
  no_grades_yet: "Все още няма оценки",
  complete_assignments_to_get_grades: "Завършете задачи, за да получите оценки",
  total_grades: "Общо Оценки",
  average_grade: "Средна Оценка",
  excellent_grades: "Отлични Оценки",
  graded_by: "Оценено от",
  recently: "Наскоро",
  viewing_grade_details: "Преглед на детайли на оценка",
  full_feedback: "Пълна обратна връзка",
  score: "Резултат",
  grade_distribution: "Разпределение на оценките",
    active: 'Активно',
    no_data: 'Няма данни',
    successful: 'Успешни',
    success_rate_small: 'процент успех',
    file_uploads: 'Качени файлове',
    folders: 'папки',
    prolog_code_editor: 'Prolog код редактор',
    save_draft: 'Запази чернова',
    clear: 'Изчисти',
    no_activity: "Няма активност",
    no_student_activities: "Все още няма активност на студенти",
    lesson_title_required: "Заглавието на урока е задължително",
    
    registered_students: "Регистрирани студенти",
    pending_approvals: "Чакащи одобрения",
    waiting_for_review: "Чака преглед",
    student_performance: "Успеваемост на студентите",
    lesson_progress: "Напредък в уроците",
    completed_lessons: "Завършени уроци",
    manage_learning_communities: "Управлявайте вашите учебни общности",
  create_community: "Създай Общност",
  create_first_community: "Създай Първа Общност",
  pending_requests: "Чакащи Заявки",
  manage_community_challenges: "Управлявайте и създавайте предизвикателства между общности",
  create_challenge: "Създай Предизвикателство",
  create_first_challenge: "Създай Първо Предизвикателство",
  communities_overview: "Преглед на Общностите",
  no_communities_dashboard: "Все още не сте създали общности",
  view_all_communities: "Виж Всички Общности",
  community_name: "Име на Общността",
  enter_community_name: "Въведете име на общността",
  grade_level: "Ниво на Клас",
  privacy_settings: "Настройки за Поверителност",
  auto_approve_students: "Автоматично одобряване на заявки за присъединяване на ученици",
  allow_student_messages: "Позволи на учениците да си изпращат съобщения",
  allow_student_challenges: "Позволи на учениците да създават предизвикателства",
  allow_inter_community_challenges: "Позволи предизвикателства между общности",
  challenge_title: "Заглавие на Предизвикателството",
  enter_challenge_title: "Въведете заглавие на предизвикателството",
  target_community: "Целева Общност",
  send_challenge: "Изпрати Предизвикателство",
    
    student_activities: "Активност на студентите",
    recent_assignments: "Последни задачи",
    last_activity: "Последна активност",
    
    lesson_title: "Заглавие на урока",
    enter_lesson_title: "Въведете заглавие на урока",
    description: "Описание",
    enter_description: "Въведете описание (незадължително)",
    
    add_lesson: "Добави урок",
    write_prolog_code: 'Напишете Prolog код тук...',
   
    upload_code_button: 'Качи код',
    clear_editor: 'Изчисти редактор',
    upload_success: 'Кодът е качен успешно!',
    no_file_user: 'Няма избран файл или потребител не е влязъл',
    only_pl_files: 'Позволени са само .pl файлове',
    upload_failed: 'Неуспешно качване:',
    file_upload_success: 'Файлът е качен успешно!',
    unexpected_error: 'Възникна неочаквана грешка',
    status_success: 'Успех',
    status_error: 'Грешка',
    status_pending: 'Чакащо',
    select_folder: 'Изберете целева папка:',
    drag_drop_file: 'Плъзнете и пуснете .pl файл тук',
    or_click_browse: 'или кликнете за да изберете',
    upload_to_folder: 'Качи в',
    clear_selection: 'Изчисти избора',
    only_pl_files_info: 'Позволени са само .pl файлове',
    files_saved_in: 'Файловете ще бъдат запазени в:',
    recent_submissions: 'Последни подадени материали',
    success_filter: 'Успешни',
    files_filter: 'Файлове',
    no_submissions: 'Все още няма подадени материали',
    start_uploading: 'Започнете с качване на първия Prolog код или файл!',
    upload_first_code: 'Качи първи код',
    no_code_preview: 'Няма наличен преглед на кода...',
    view_details: 'Виж детайли',
    run_again: 'Пусни отново',
    
    // Нови dashboard преводи
    welcome_subtitle: 'Ето вашия напредък в ученето и предстоящите дейности',
    search_placeholder: 'Търсене на курсове, уроци...',
    learning_platform: 'Образователна платформа',
    my_courses: 'Моите курсове',
    assignments: 'Задания',
    progress: 'Напредък',
    settings: 'Настройки',
    learning_progress: 'Напредък в обучението',
    week: 'Седмица',
    month: 'Месец',
    year: 'Година',
    all_time: 'Всичко',
    completion_rate: 'Процент на завършване',
    total_study_hours: 'Общо учебни часове',
    completed_tasks: 'Завършени задачи',
    streak_days: 'Дни в ред',
    progress_over_time: 'Напредък във времето',
    skill_distribution: 'Разпределение на уменията',
    completed_assignment: 'Завършено задание',
    uploaded_file: 'Качен файл',
    achieved_milestone: 'Постигнат етап',
    browse_files: 'Изберете файлове',
    or: 'или',
    upload_to: 'Качи в',
    make_first_submission: 'Направете първото си подаване',
    all_assignments: 'Всички задания',
    in_progress: 'В процес',
    completed: 'Завършено',
    pending: 'Чакащо',
    due: 'Срок',
    tasks: 'задачи',
    details: 'Детайли',
    continue_learning: 'Продължи обучението',
    complete: 'Завършено',
    weekly_progress: 'Седмичен напредък',
    weekly_completion: 'Процент на завършване за седмицата',
    learning_hours: 'Учебни часове',
    daily_study_hours: 'Ежедневни учебни часове тази седмица',
    my_assignments: 'Моите задания',
    articles: 'Статии',
    view_all: 'Виж всички',
    please_login: "Моля, влезте в профила си, за да продължите",
    
    // Login page преводи
    login_description: "Продължете пътешествието си в STEM образованието с изкуствен интелект и разгледайте интерактивни програмни концепции.",
    access_projects: "Достъп до вашите проекти",
    track_progress: "Проследявайте напредъка си",
    collaborate_peers: "Сътрудничество със съученици",
    sign_in_account: "Вход във вашия акаунт",
    enter_credentials: "Въведете вашите данни, за да продължите ученето",
    email_address: "Имейл адрес",
    enter_email: "Въведете имейл",
    password: "Парола",
    enter_password: "Въведете парола",
    remember_me: "Запомни ме",
    forgot_password: "Забравена парола?",
    signing_in: "Влизане...",
    sign_in_ideas: "Вход в IDEAS",
    new_to_ideas: "Нов в IDEAS?",
    create_account: "Създай акаунт",
    terms_agreement: "Продължавайки, вие се съгласявате с нашите",
    and: "и",
    
    // Register page преводи
    register_title: "Присъединете се към IDEAS общността",
    register_journey_title: "Започнете пътешествието си в STEM ученето днес",
    register_platform_description: "Започнете пътешествието си в STEM образованието с изкуствен интелект и разгледайте света на логическото програмиране и изкуствения интелект.",
    join_platform: "Присъединете се към",
    interactive_tutorials: "Интерактивни уроци",
    hands_on_projects: "Практически проекти",
    collaborative_learning: "Съвместно учене",
    progress_tracking: "Проследяване на напредъка",
    create_your_account: "Създайте своя акаунт",
    start_stem_journey: "Започнете пътешествието си в STEM ученето днес",
    confirm_password: "Потвърдете паролата",
    confirm_password_placeholder: "Потвърдете паролата си",
    password_placeholder: "Създайте парола (мин. 6 символа)",
    i_agree_to: "Съгласявам се с",
    send_me_updates: "Изпращайте ми образователни ресурси и актуализации",
    creating_account: "Създаване на акаунт...",
    create_ideas_account: "Създай акаунт в IDEAS",
    already_have_account: "Вече имате акаунт?",
    sign_in_existing: "Вход в съществуващ акаунт",
    register_footer_text: "Създавайки акаунт, вие се съгласявате с политиките на платформата и образователните насоки.",
    successful_executions: "Успешни изпълнения",
assignments_completed: "Завършени задания",
active_streak: "Активна поредица",
current_activity_streak: "Текуща активна поредица",
review: "Преглед",
lines: "редове",
code_editor: "Редактор на код",
about_us:"За нас",
  prolog_demo:"Prolog Demo",
    // Validation messages преводи
    password_mismatch: "Паролите не съвпадат",
    password_too_short: "Паролата трябва да бъде поне 6 символа",
    password_weak: "Паролата е твърде слаба",
    email_in_use: "Този имейл вече се използва",
    invalid_email: "Невалиден имейл адрес",
    quick_message: "Бързо Съобщение",
  quick_message_desc: "Изпратете бързо съобщение до ученици или общности",
  open_mail: "Отвори Поща",
  broadcast_all_students: "Изпрати до Всички Ученици",
  type_your_message_here: "Напишете вашето съобщение тук...",
  new_messages: "Нови Съобщения",
  mark_all_read_confirm: "Маркирай всички съобщения като прочетени?",
  click_to_mark_read: "Кликнете за маркиране като прочетено",
  view_all_messages: "Виж Всички Съобщения",
    // Register success message
    registration_successful: "Регистрацията е успешна! Добре дошли в IDEAS.",
    
    // Theme toggle преводи
    switch_to_light: "Превключи към светла тема",
    switch_to_dark: "Превключи към тъмна тема",
    dark_mode: "Тъмен режим",
    light_mode: "Светъл режим",
    view_template: "Виж шаблон",
    mountains: "Планини",
    
    // Нови преводи за липсващите ключове
    what_to_learn: "Какво да научите",
    explore_courses: "Разгледайте курсове",
    published: "Публикувани",
  all_lessons: "Всички уроци",
  search_lessons: "Търсене на уроци...",
  total_lessons: "Общо уроци",
  no_matching_lessons: "Няма намерени съвпадащи уроци",
  try_changing_criteria: "Опитайте да промените критериите за търсене или филтър",
  
  
  // Съобщения и дискусии
  message_thread: "Нишка на съобщението",
  start_conversation: "Започнете разговора, като изпратите съобщение по-долу",
  type_message: "Напишете съобщението си...",
  just_now: "Току-що",
  all_messages_read: "Всички съобщения са маркирани като прочетени!",
  messages_sent: "съобщения са изпратени успешно",
  message_all: "Съобщение до всички",
  student_wants_to_join: "{student} иска да се присъедини към '{community}'",
  join_request: "Заявка за присъединяване",
  
  // Управление на уроци
  lesson_updated: "Урокът е обновен успешно!",
  lesson_created: "Урокът е създаден успешно!",
  error_saving_lesson: "Грешка при запазване на урока!",
  confirm_delete_lesson: "Сигурни ли сте, че искате да изтриете този урок?",
  lesson_deleted: "Урокът е изтрит успешно!",
  error_deleting_lesson: "Грешка при изтриване на урока!",
  programming: "Програмиране",
  new_lesson_created: "Създаден е нов урок",
  
  // Предизвикателства и общности
  need_community_for_challenges: "Трябва да създадете общност, преди да можете да създавате предизвикателства.",
  no_community_selected: "Няма избрана общност",
  select_community_for_challenges: "Моля, изберете общност от раздела Общности, за да видите и управлявате предизвикателства.",
  go_to_communities: "Към Общностите",
  sent_successfully: "е изпратено успешно",
  
  // Оценяване и обратна връзка
  grade_notification: 'Вашата работа "{file}" беше оценена. Точки: {points}/10. Обратна връзка: {feedback}',
  grade_assigned: "Оценката е присъдена",
  grade_assigned_details: 'Присъдени {points}/10 точки за "{file}"',
  error_saving_grade: "Грешка при запазване на оценката! Проверете конзолата за детайли.",
  graded: "оценени",
  unknown_student: "Непознат ученик",
  
  // Управление на общности
  community_created: "Общността е създадена успешно!",
  error_creating_community: "Грешка при създаване на общност!",
  student_approved: "Ученикът е одобрен успешно!",
  error_approving_student: "Грешка при одобряване на ученик!",
  request_rejected: "Заявката е отхвърлена!",
  error_rejecting_request: "Грешка при отхвърляне на заявка!",
  id: "Идентификатор",
  
  // Активности и действия
  created_expert_system: "Създадена експертна система за проект по биология",
  uploaded_assignment: "Качен файл със задание",
  completed_logical_rules: "Завършено задание за логически правила",
    
    // Нови преводи за PrologChat
    prolog_assistant: 'Prolog AI Помощник',
    domain_based_knowledge: 'Базови знание по домейни',
    chat_stats: 'Статистика на чата',
    active_domain: 'Активен домейн',
    domain: 'Домейн',
    no_active_domain: 'Няма активен домейн',
    knowledge_domains: 'Домейни знание',
    clear_domain: 'Изчисти домейн',
    clear_chat: 'Изчисти чат',
    chat: 'Чат',
    code_preview: 'Преглед на код',
    system_commands: 'Системни команди',
    file_management: 'Управление на файлове',
    enter_filename: 'Въведете име на файл (напр., animals.pl)',
    file_command_hint: 'Въведете име на файл по-горе, след което кликнете върху файлова команда',
    responses: 'отговори',
    expand_chat: 'Разшири чата',
    collapse_chat: 'Свий чата',
    loading_domain: 'Зареждане на домейн',
    domain_loaded_success: 'Домейн зареден успешно. Готов за заявки.',
    domain_load_error: 'Грешка при зареждане на домейн',
    thinking: 'Мисля',
    no_server_response: 'Няма отговор от сървъра',
    connection_error: 'Грешка при връзка',
    select_domain_first: 'Първо изберете домейн',
    enter_prolog_query: 'Въведете Prolog заявка за',
    press_enter_to_send: 'Натиснете Enter за изпращане',
    queries_end_with_period: 'Уверете се, че заявките завършват с точка (.)',
    connected_to: 'Свързан с',
    no_domain_selected: 'Няма избран домейн',
    select_domain_to_view: 'Изберете домейн от страничната лента, за да видите неговите кодови файлове.',
    no_code_files_for: 'Няма кодови файлове за',
    upload_code_for_domain: 'Качете кодови файлове за този домейн, за да ги видите тук.',
    files: 'файлове',
    no_domain: 'Няма домейн',
    copy_code: 'Копирай код',
    view_full_code: 'Виж пълния код',
    api_server: 'API сървър',
    queries: 'Заявки',
    code_files: 'Кодови файлове',
  overdue_assignments: "Просрочени задания",
  overdue: "Просрочено",
  sort_by_due_date: "Сортирай по краен срок",
  sort_by_completion: "Сортирай по завършване",
  sort_by_submissions: "Сортирай по предадени",
    none: 'Няма',
    animals: 'Животни',
    history: 'История',
    geography: 'География',
    mineral_water: 'Минерална вода',
    animal_facts_description: 'Факти и взаимоотношения за животни',
    historical_facts_description: 'Исторически събития и личности',
    geographical_facts_description: 'Географски факти и местоположения',
    mineral_water_description: 'Източници и свойства на минерални води',
    help: 'Помощ',
    load_all: 'Зареди Всички',
    list_files: 'Списък Файлове',
    clear_facts: 'Изчисти Факти',
    current_file: 'Текущ Файл',
    list_predicates: 'Списък Предикати',
    unload_all: 'Разтовари Всички',
    consult_file: 'Консултирай Файл',
    reconsult_file: 'Повторно Консултирай',
    unload_file: 'Разтовари Файл',
    switch_file: 'Смени Файл',
    example_queries: '📚 Примерни Заявки:\n\n',
    
    // Tooltips
    help_tooltip: 'Покажи информация за помощ',
    load_all_tooltip: 'Зареди всички Prolog файлове',
    list_files_tooltip: 'Изведи списък на всички заредени файлове',
    clear_facts_tooltip: 'Изчисти всички заредени факти',
    current_file_tooltip: 'Покажи текущия активен файл',
    list_predicates_tooltip: 'Изведи списък на всички налични предикати',
    unload_all_tooltip: 'Разтовари всички Prolog файлове',
    consult_file_tooltip: 'Зареди Prolog файл',
    reconsult_file_tooltip: 'Презареди Prolog файл',
    unload_file_tooltip: 'Разтовари Prolog файл',
    switch_file_tooltip: 'Смени на друг файл',
    student_account: "Училищен профил",
practice_makes_perfect: "Упражненията правят майстори",
practice_makes_perfect_desc: "Опитай се да решиш 3 нови Prolog задачи тази седмица, за да подобриш уменията си",
complete_assignments_early: "Завършвай заданията рано",
complete_assignments_early_desc: "Подавай работата си 2 дни преди крайния срок за бонус точки",
join_study_group: "Присъедини се към учебна група",
join_study_group_desc: "Сътрудничай със съученици върху сложни Prolog проекти",
start_now: "Започни сега",
view_assignments: "Виж заданията",
join_now: "Присъедини се сега",
success_rate_trend: "Тенденция на успеваемостта",
submit_assignments_projects: "Подай своите задания и проекти",
templates: "Шаблони",
submit_code: "Подай код",
submissions_found: "намирени подадени работи",
check_back_later: "Върни се по-късно за нови задания",
all_status: "Всички статуси",
all_difficulty: "Всички трудности",
browse_courses: "Разгледай курсове",
view_course: "Виж курса",
continue: "Продължи",
track_achievements: "Следи постиженията си и растежа",
uploaded: "Качено",
expert_system: "Експертна система",
general_knowledge: "Общи знания",
general_assignment: "Общо задание",
date: "Дата",
prolog_submission: "Prolog задание",
no_submissions_yet: "Няма подадени работи",
assignments_found: "намирени задания",
success: "Успех",
from: "от",
  my_challenge_solutions: "Моите Решения на Предизвикателства",
  no_solutions_yet: "Все още няма решения",
  join_challenges_to_solve: "Присъединете се към предизвикателства, за да започнете да решавате!",
  browse_challenges: "Разгледайте Предизвикателства",
  view_solution: "Виж Решение",
  continue_solving: "Продължи Решаването",
  message_community: "Съобщение на Общността",
  messages: "Съобщения",
  type_message_here: "Напишете съобщение тук...",
  select_recipient: "Изберете получател",
  message_history: "История на Съобщенията",
  you: "Вие",
  no_messages_yet: "Все още няма съобщения",
    // Балкан преводи
    balkan: 'Балкан',
    balkan_description: 'Балкански източници и свойства',
    central_balkan: 'Централен Балкан',
    
    // Нови преводи за Header и PrologChat
    file_commands: 'Файлови команди',
    loading: 'Зареждане',
    upload_new_file: 'Качи нов файл',
    drag_drop_file_to_upload: 'Плъзнете и пуснете .pl файл за качване',
    uploading: 'Качване',
    no_file_user_domain: 'Няма избран файл, потребител не е влязъл или домейн не е избран',
    uploading_file: 'Качване на файл...',
    upload_to_domain: 'Качи в домейн',
    code: 'Код',
    file_commands_title: 'Файлови команди',
    class: 'Клас',
    average_points: 'Средни точки',
    actions: 'Действия',
    grade_saved: 'Оценката е запазена',
    for: 'за',
    feedback_saved: 'Обратната връзка е запазена успешно!',
    close_window: 'Затвори прозореца',
    load_assignments_error: 'Грешка при зареждане на заданията:',
    login_as_teacher: 'Моля, влезте като учител!',
    assignment_updated: 'Заданието е обновено успешно!',
    assignment_created: 'Заданието е създадено успешно!',
    save_assignment_error: 'Грешка при запазване на заданието!',
    assignment_deleted: 'Заданието е изтрито успешно!',
    confirm_delete_assignment: 'Сигурни ли сте, че искате да изтриете това задание?',
    loading_students: 'Зареждане на ученици...',
    no_access_rights: 'Няма права за достъп',
    load_students_error: 'Грешка при зареждане на ученици:',
    excellent: 'Отличен',
    good: 'Добър',
    average: 'Среден',
    needs_improvement: 'Нуждае се от подобрение',
    poor: 'Слаб',
    load_assignments: 'Зареждане на задания...',
    no_assignments_yet: 'Все още няма задания',
    create_first_assignment: 'Създай първо задание',
    edit_assignment: 'Редактиране на задание',
    create_assignment: 'Създай ново задание',
    assignment_title: 'Заглавие на заданието',
    assignment_title_placeholder: 'Пример: Създаване на експертна система',
    topic: 'Тема',
    topic_placeholder: 'Пример: Насекоми, Химични реакции, Електричество',
    biology: 'Биология',
    chemistry: 'Химия',
    physics: 'Физика',
    challenge_response_on: "Отговор на",
  challenge_reject: "Отхвърли Предизвикателство",
    other: 'Друг',
    due_date: 'Краен срок',
    objective: 'Цел',
    objective_placeholder: 'Опишете целта на заданието...',
    description_placeholder: 'Кратко описание на заданието...',
    background_image: 'Фоново изображение',
    category: 'Категория',
    minimum_requirements: 'Минимални изисквания',
    min_facts: 'Минимум факти',
    min_rules: 'Минимум правила',
    combined_rules: 'Комбинирани правила',
    menu_items: 'Меню пунктове',
    difficulty: 'Трудност',
    easy: 'Лесно',
    medium: 'Средно',
    hard: 'Трудно',
    points: 'Точки',
    example_code: 'Примерен код',
    example_code_placeholder: 'Можете да предоставите примерен Prolog код...',
    optional: 'незадължително',
    save_changes: 'Запази промените',
    create_articles: 'Създай статии',
    draft: 'Чернова',
    edit: 'Редактирай',
    view: 'Преглед',
    active_assignments: 'Активни задания',
    total_assignments: 'Общо задания',
    category_statistics: 'Статистика по категории',
    assignment_distribution: 'Разпределение на заданията',
    manage_students_subtitle: 'Преглед на ученическите подадени материали и оценяване',
    search_students: 'Търсене на ученици...',
    refresh: 'Обнови',
    close: "Затвори",
    download_code: "Изтегли код",
    download: "Изтегли",
    view_grade: "Виж оценка",
    view_download_submissions: "Преглед и изтегляне на вашите решения",
    new_submission: "Ново решение",
    resubmit: "Предай отново",
    graded_on: "Оценено на",
    submitted_on: "Предадено на",
    pending_evaluation: "Чака оценяване",
    assignment_not_graded: "Тази задача все още не е оценена",
    assignment_evaluation: "Оценка на задачата",
    code_execution_success: "Успешно изпълнение на код",
    consecutive_days_active: "Последователни активни дни",
    keep_it_up: "Продължавай така!",
    pending_assignments: "Чакащи",
    needs_submission: "Нуждае се от решение или оценяване",
    requires_attention: "Нуждае се от внимание",
    no_recent_activity: "Няма скорошна активност",
    export: 'Експорт',
    filter: 'Филтър',
    please_wait: 'Моля, изчакайте докато вземаме ученическата информация...',
    no_students_found: 'Не са намерени ученици',
    no_students_description: 'Не са намерени ученици с качени файлове в системата.',
    last_upload: 'Последно качване',
    avg_points: 'Ср. точки',
    grade: 'Оценка',
    view_files: 'Виж файлове',
    send_message: 'Изпрати съобщение',
    more_options: 'Още опции',
    student_files: 'Файлове на ученика',
    file_folder: 'Папка',
    file_date: 'Дата',
    file_size: 'Размер',
    view_code: 'Виж код',
    download_file: 'Изтегли файл',
    grade_file: 'Оцени този файл',
    no_files_found: 'Няма намерени файлове за този ученик',
    grade_student: 'Оцени ученик',
    assign_points: 'Възложи точки',
    selected_points: 'Избрани точки',
    feedback: 'Обратна връзка',
    add_feedback_placeholder: 'Добавете подробна обратна връзка...',
    excellent_work: 'Отлична работа!',
    needs_correction: 'Нуждае се от корекция',
    missing_requirements: 'Липсват изисквания',
    creative_solution: 'Креативно решение',
    save_grade: 'Запази оценка',
    showing: 'Показване',
    of: 'от',
    showing_of: 'Показване {0} от {1}',
    
    // НОВИ КЛЮЧОВЕ ОТ ПОСЛЕДНИЯ АНАЛИЗ:
    teacher_dashboard: 'Учителско табло',
    student_dashboard: 'Ученическо табло',
    teacher: 'Учител',
    assignment_instructions_1: 'Проектът трябва да съдържа:',
    assignment_instructions_2: 'Заглавна секция (коментари) - предмет, тема, име на ученика, клас, дата',
    assignment_instructions_3: 'База от знания (факти) - минимум 20 факта, свързани с темата',
    assignment_instructions_4: 'Логически правила - минимум 5 правила, които извеждат нова информация',
    assignment_instructions_5: 'Потребителско меню - главен предикат start/0, меню с поне 5 възможности',
    assignment_instructions_6: 'Работещи заявки - системата трябва да отговаря правилно',
    delete_assignment_error: 'Грешка при изтриване на задание!',
    untitled: 'Без заглавие',
    no_code: 'Няма код',
    uncategorized: 'Без категория',
    completed_assignments: 'Завършени задания',
    in_progress_assignments: 'Задания в процес',
    
    // Статуси за потребители
    warning: 'Предупреждение',
    inactive: 'Неактивен',
    
    // Учителски инструкции
    teacher_name: 'Име на учител',
    total_files: 'Общо файлове',
    select_domain_to_view_code:"Изберете предметна област, за да видите примери на Prolog код",
    // ============================================
// PrologGuide

prolog_guide_intro_title: "Въведение в Логическото Програмиране",
prolog_guide_intro_desc: "Този структуриран курс ще ви преведе през основните концепции на логическото програмиране и Prolog. Всеки урок съчетава теория с практически упражнения.",










  },
  es: {
    // ============================================
// PrologGuide
// ============================================
// Заглавия на табовете
  "tutorials": "Tutoriales",
  "videos": "Vídeos",
  "puzzles": "Rompecabezas",
  "extras": "Extras",
  "examples": "Ejemplos",
  "resources": "Recursos",
  
  // Типове уроци
  "video": "Vídeo",
  "puzzle": "Rompecabezas",
  "extra": "Extra",
  
  // Съобщения за липса на съдържание
  "no_videos": "No hay vídeos disponibles",
  "no_videos_desc": "Vuelva más tarde para ver lecciones en vídeo.",
  "no_puzzles": "No hay rompecabezas disponibles",
  "no_puzzles_desc": "Vuelva más tarde para ver rompecabezas.",
  "no_extras": "No hay contenido extra disponible",
  "no_extras_desc": "Vuelva más tarde para ver contenido extra.",
  "no_lessons": "No hay lecciones disponibles",
  "no_lessons_desc": "Vuelva más tarde para ver nuevas lecciones.",
  
  // Навигация
  "back_to_lessons": "Volver a las lecciones",
  "previous": "Anterior",
  "next": "Siguiente",
  "visit": "Visitar",
  "lesson": "Lección",
  
  // Други
  "example": "Ejemplo",
  "output": "Salida",
  "duration": "Duración",
  "language": "Idioma",
  "lessons_videos": "Lecciones y Vídeos",
  "introduction_title": "Introducción a la Programación Lógica",
  "introduction_description": "Este curso estructurado le guiará a través de los conceptos fundamentales de la programación lógica y Prolog. Cada lección combina teoría con ejercicios prácticos.",
  
  // Prolog Guide описания
  "prolog_guide_subtitle": "Domina la programación lógica a través de ejemplos interactivos",
  "prolog_guide_description": "Prolog es un lenguaje de programación lógica asociado con la inteligencia artificial y la lingüística computacional. Esta guía completa cubre conceptos fundamentales a través de ejemplos prácticos del mundo real.",

prolog_guide_intro_title: "Introducción a la Programación Lógica",
prolog_guide_intro_desc: "Este curso estructurado te guiará a través de los conceptos fundamentales de la programación lógica y Prolog. Cada lección combina teoría con ejercicios prácticos.",


// ============================================
// Допълнителна информация
// ============================================
platform_activity: "Actividad de la Plataforma",
this_month: "Este Mes",
data_security: "Seguridad de Datos",

// ============================================
// Активности
// ============================================
activity_new_school: "Nueva escuela añadida a la plataforma",
activity_knowledge_base: "Base de conocimiento actualizada",
activity_new_materials: "Nuevos materiales educativos subidos",
activity_user_registered: "Usuario registrado",
minutes_ago: "minutos atrás",

// ============================================
// Статуси за потребители
// ============================================
warning: "Advertencia",
inactive: "Inactivo",

// ============================================
// Учителски инструкции
// ============================================
teacher_name: "Nombre del Profesor",
secure_login: "Inicio de Sesión Seguro",
security_description: "Tus datos están encriptados y protegidos",

// ============================================
// Статистика
// ============================================
total_students: "Total de Estudiantes",
total_files: "Total de Archivos",
no_uploads: "Aún no hay archivos subidos",

// ============================================
// Други
// ============================================
not_pl_file: "El archivo no es un archivo .pl",
upload_successful: "Carga exitosa",
catch_block_error: "Ocurrió un error",
option: "Opción",
loading_assignments: "Cargando tareas...",
loading_solutions: "Cargando tus soluciones...",
challenge_id: "ID del desafío",
challenge_not_loaded: "Desafío no cargado",
solution_status: "Estado de la solución",
your_grade: "Tu calificación",
    select_domain_to_view_code:"Elige un dominio de conocimiento para ver ejemplos de código Prolog",
    select_file_to_grade: "Seleccionar archivo para calificar",
    // В обекта translations.es добавете:
create_knowledge_title: "Crear Bases de Conocimiento",
create_knowledge_desc: "Crea bases de conocimiento estructuradas a partir de tus materiales de aprendizaje y organiza la información para tus clases.",
create_feature_1: "Estructuración de materiales de aprendizaje",
create_feature_2: "Conexiones semánticas entre conceptos",
create_feature_3: "Categorización y etiquetado",
start_creating: "Comenzar a Crear",
message_to_all_community: "Este mensaje será enviado a todos en la comunidad",
  message_to_community_members: "Este mensaje será enviado a los miembros de la comunidad",
  no_students_in_community: "No hay estudiantes en esta comunidad",
  no_community_members: "No hay otros miembros en tu comunidad",
  teachers_and_my_students: "Profesores y mis estudiantes",
  community_students: "Estudiantes de la comunidad",
  my_community_members: "Miembros de mi comunidad",
  community_teacher: "Profesor de la Comunidad",
  other_teachers: "Otros profesores",
  my_students: "Mis estudiantes",
  available_recipients: "Destinatarios disponibles",
  my_community: "Mi Comunidad",
  student_messages: "Mensajes - Estudiante",
  teacher_messages: "Mensajes - Profesor",
  available_users: "usuarios disponibles",
  broadcast_teachers_only: "Solo los profesores pueden transmitir a todos los estudiantes",
  not_your_community: "¡No puedes enviar a esta comunidad!",
  not_in_community: "¡No estás en una comunidad!",
  cannot_send_outside_community: "No se pueden enviar mensajes fuera de tu comunidad",
  cannot_send_to_student: "Los estudiantes no pueden enviar mensajes a otros estudiantes",
use_knowledge_title: "Usar Bases de Conocimiento",
use_knowledge_desc: "Busca y utiliza bases de conocimiento ya creadas para tus proyectos educativos e investigaciones.",
use_feature_1: "Búsqueda rápida en bases de conocimiento",
use_feature_2: "Recomendaciones personalizadas",
use_feature_3: "Acceso a la comunidad de conocimiento",
start_using: "Comenzar a Usar",

total_knowledge_bases: "Bases de Conocimiento",
active_creators: "Creadores Activos",
educational_topics: "Temas Educativos",
    choose_assignment: 'Elegir una tarea',
use_template: 'Usar Plantilla',
assignment_info: 'Información de la Tarea',
title: 'Título',
requirements: 'Requisitos',
file_information: 'Información del Archivo',
type: 'Tipo',
student_name: 'Nombre del Estudiante',
data_area: 'Área de Datos',
prolog_code: 'Código Prolog',
update_header: 'Actualizar Encabezado',
    review_code: 'Revisar Código',
start_work: 'Comenzar Trabajo',
select_assignment: '¡Por favor, seleccione una tarea primero!',
todays_tasks: 'Tareas Prolog de Hoy',
task_details: 'Detalles de la Tarea',
no_tasks_today: '¡No hay tareas para hoy!',
all_caught_up: 'Estás al día con tus tareas Prolog.',
assignment_progress: 'Progreso de Tareas',
difficulty_distribution: 'Distribución de Dificultad',
by_difficulty: 'Tareas por dificultad',
no_active_assignments: 'No hay tareas activas en este momento.',
facts: 'hechos',
rules: 'reglas',
  challenge_accept: "Acepta el desafío",
review_submission: 'Revisar Entrega',
assignment_completion: 'Finalización de Tarea',
header_copied: '¡Encabezado copiado al portapapeles!',
copy_header: 'Copiar Encabezado',
    // Header преводи
    status_completed: 'Completado',
status_in_progress: 'En Progreso',
    completed_assignments_count: 'Tareas Completadas',
in_progress_assignments_count: 'Tareas en Progreso',
total_assignments_count: 'Tareas Totales',
challenge_view_submissions:"Ver envíos",
    home: 'Inicio',
    topics: 'Temas',
    dashboard: 'Panel',
    prolog_chat: 'Chat Prolog',
    sign_in: 'Iniciar sesión',
    get_started: 'Empezar',
    logout: 'Cerrar sesión',
    innovation_platform: 'Plataforma de innovación',
    admin_dashboard: 'Panel de Administración',

code_updated: '¡Código actualizado exitosamente!',
upload_error: '¡Error subiendo código!',

new_join_request: 'Nueva solicitud de unión a la comunidad',
    // Home page преводи
    ideas_acronym: 'Sistema Inteligente de Análisis Educativo de Datos',
    hero_title_part1: 'Transforma la Educación',
    hero_title_part2: 'con Aprendizaje Impulsado por IA',
    hero_description: 'Empodera a los estudiantes con conceptos de programación lógica e inteligencia artificial a través de proyectos STEM interactivos y prácticos.',
    get_started_free: 'Comenzar Gratis',
    view_demos: 'Ver Demostraciones',
    schools: 'Escuelas',
    students: 'Estudiantes',
    projects: 'Proyectos',
    teacher_pending_approval: "Aprobación Pendiente",
  welcome_teacher: "¡Bienvenido, Profesor!",
  account_under_review: "Su cuenta está en proceso de revisión",
  admin_approval_needed: "Su cuenta debe ser aprobada por un administrador antes de poder acceder al panel del profesor.",
  step_1: "Creación de Perfil",
  profile_created: "Perfil creado exitosamente",
  create_profile: "Crear perfil de profesor",
  step_2: "Aprobación del Administrador",
  awaiting_admin_approval: "Su cuenta está esperando la aprobación del administrador",
  step_3: "Acceso al Panel",
  access_dashboard: "Obtendrá acceso a todas las funciones del profesor",
  your_information: "Su Información",
  full_name: "Nombre Completo",
  email: "Correo Electrónico",
  institution: "Escuela/Institución",
  status: "Status",
  pending_approval: "Aprobación Pendiente",
  what_happens_next: "¿Qué pasa después?",
  step1_description: "El administrador revisará su registro",
  step2_description: "Recibirá un correo electrónico cuando su cuenta sea aprobada",
  step3_description: "Después de la aprobación tendrá acceso completo al panel del profesor",
  refresh_status: "Verificar Estado",
  contact_admin: "Contáctenos",
  estimated_approval_time: "La aprobación generalmente tarda 24-48 horas en días hábiles",
  
    features_title_part1: 'Todo lo que necesitas para enseñar',
    features_title_part2: 'IA y Programación Lógica',
    features_description: 'Herramientas y recursos integrales diseñados específicamente para la educación STEM',
    feature1_title: 'Aprendizaje Impulsado por IA',
    feature1_description: 'Tutoriales interactivos y sistemas de retroalimentación inteligente que se adaptan al ritmo de aprendizaje de cada estudiante.',
    feature2_title: 'Colaboración en Tiempo Real',
    feature2_description: 'Los estudiantes trabajan juntos en proyectos con edición en vivo y retroalimentación instantánea.',
    feature3_title: 'Proyectos Prácticos',
    feature3_description: 'Proyectos STEM prácticos que aplican programación lógica a problemas del mundo real.',
    feature4_title: 'Análisis de Progreso',
    feature4_description: 'Información detallada sobre el rendimiento y patrones de aprendizaje de los estudiantes.',
    feature5_title: 'Integración Curricular',
    feature5_description: 'Se integra perfectamente en los currículos STEM existentes con planes de lecciones listos para usar.',
    feature6_title: 'Habilidades para la Industria',
    feature6_description: 'Prepara a los estudiantes para carreras en IA, ciencia de datos y tecnología.',
    explore_tools: 'Explorar Herramientas de IA',
    start_collaborating: 'Comenzar a Colaborar',
    view_projects: 'Ver Proyectos',
    see_analytics: 'Ver Análisis',
    browse_curriculum: 'Explorar Currículo',
    classmates: "Compañeros",
    learn_skills: 'Aprender Habilidades',
    demo_title_part1: 'Ver IDEAS',
    demo_title_part2: 'en Acción',
    demo_description: 'Experimenta cómo nuestra plataforma transforma conceptos de programación complejos en experiencias de aprendizaje atractivas e interactivas que los estudiantes adoran.',
    demo_feature1_title: 'Interfaz de Programación Visual',
    demo_feature1_description: 'Bloques de lógica de arrastrar y soltar para un aprendizaje intuitivo',
    demo_feature2_title: 'Ejecución de Código en Tiempo Real',
    demo_feature2_description: 'Ve los resultados al instante mientras escribes código Prolog',
    demo_feature3_title: 'Tutoriales Interactivos',
    demo_feature3_description: 'Experiencias de aprendizaje guiadas paso a paso',
    demo_feature4_title: 'Espacio de Trabajo Colaborativo',
    demo_feature4_description: 'Trabaja junto con compañeros en tiempo real',
    explore_live_demos: 'Explorar Demostraciones en Vivo',
    try_free_tutorial: 'Probar Tutorial Gratis',
    
    // Footer преводи
    footer_description: 'Empoderando a la próxima generación de innovadores a través de la programación lógica y la educación en IA. Transformando el aprendizaje STEM en todo el mundo.',
    footer_platform: 'Plataforma',
    footer_support: 'Soporte',
    help_center: 'Centro de Ayuda',
    contact_us: 'Contáctanos',
    privacy_policy: 'Política de Privacidad',
    terms_of_service: 'Términos de Servicio',
    documentation: 'Documentación',
    submissions: 'Envíos',
    all_rights_reserved: 'Todos los derechos reservados.',
    privacy: 'Privacidad',
    terms: 'Términos',
    cookies: 'Cookies',
    highest: "Más Alto",
  high: "Alto",
  normal: "Normal",
  low: "Bajo",
  priority: "Prioridad",
  
  // Статистики и време
  no_grades_data: "No hay datos de calificaciones disponibles",
  week_short: "sem",
  hours_ago: "hace {hours} horas",
  days_ago: "hace {days} días",
  this_week: "Esta Semana",
  
  // Съобщения и грешки
  error_pinning_message: "Error al fijar mensaje",
  
  // Филтри и обхват
  all_teachers_students: "Todos los Profesores y Estudiantes",
  my_community_only: "Solo Mi Comunidad",
  people: "Personas",
  selected: "Seleccionados",
  unread_only: "Solo No Leídos",
  starred_only: "Solo Destacados",
  with_attachments: "Con Archivos Adjuntos",
  clear_filters: "Limpiar Filtros",
  
  // Състояния на поща
  inbox_empty: "La bandeja de entrada está vacía",
  inbox_empty_desc: "Cuando recibas mensajes, aparecerán aquí",
  no_messages_desc: "No hay mensajes para mostrar",
  write_message: "Escribir un mensaje",
  message_details: "Detalles del Mensaje",
  read: "Leído",
  
  // Действия с messages
  archive: "Archivar",
  unarchive: "Desarchivar",
  pin: "Fijar",
  unpin: "Desfijar",
  
  // Прикачени файлове
  attachments: "Archivos Adjuntos",
  add_attachments: "Agregar Archivos Adjuntos",
  
  // Типове нотификации
  assignment_submission: "assignment_submission",
  direct: "direct",
  
  // Информация за студенти
  student_notifications_info: "Aquí recibirás notificaciones sobre tus actividades",
  send_message_to: "Enviar mensaje a {name}",
    
    // Dashboard преводи (основни)
    welcome_back: '¡Bienvenido de nuevo!',
    upload_code: 'Subir Código',
    upload_file: 'Subir Archivo',
    quick_stats: 'Estadísticas Rápidas',
    total_submissions: 'Total de Envíos',
    success_rate: 'Tasa de Éxito',
    upload_prolog_code: 'Subir Código Prolog',
    upload_prolog_file: 'Subir Archivo Prolog',
    my_submissions: 'Mis Envíos',
    active: 'Activo',
    no_data: 'Sin datos',
    successful: 'Exitosos',
    success_rate_small: 'tasa de éxito',
    file_uploads: 'Archivos Subidos',
    folders: 'carpetas',
    prolog_code_editor: 'Editor de Código Prolog',
    save_draft: 'Guardar Borrador',
    clear: 'Limpiar',
    write_prolog_code: 'Escribe tu código Prolog aquí...',
   
    upload_code_button: 'Subir Código',
    clear_editor: 'Limpiar Editor',
    upload_success: '¡Código subido exitosamente!',
    no_file_user: 'No hay archivo seleccionado o usuario no conectado',
    only_pl_files: 'Solo se permiten archivos .pl',
    upload_failed: 'Error al subir:',
    file_upload_success: '¡Archivo subido exitosamente!',
    challenge_rejected: "Desafío rechazado",
  challenge_reject_error: "Error al rechazar el desafío",
  challenge_accepted: "Desafío aceptado",
  challenge_accept_error: "Error al aceptar el desafío",
  approve: "Aprobar",
  reject: "Rechazar",
  challenge_response_title: "Respuesta del Desafío",
  challenge_solution_title: "Solución del Desafío",
  challenge_view_solution_code: "Ver Código de Solución",
  challenge_response_from: "Respuesta de",
  challenge_respond: "Responder al Desafío",
  challenge_reject_confirm: "¿Está seguro de que desea rechazar este desafío?",
  challenge_view_response: "Ver Respuesta",
  challenge_response_content: "Contenido de la Respuesta",
  challenge_response_placeholder: "Escriba su respuesta aquí...",
  challenge_solution_code: "Código de Solución",
  challenge_solution_code_placeholder: "Escriba su código de solución aquí...",
  challenge_send_response: "Enviar Respuesta",
    inbox: "Bandeja de entrada",
  starred: "Destacados",
  sent: "Enviados",
  drafts: "Borradores",
  trash: "Papelera",
  unknown_user: "User_{0}",
  error_loading_users: "Error cargando usuarios",
  error_loading_communities: "Error cargando comunidades",
  error_loading_messages: "Error cargando mensajes",
  unknown: "Desconocido",
  no_subject: "Sin asunto",
  login_required: "¡Por favor, inicie sesión!",
  message_content_required: "¡Por favor, ingrese contenido del mensaje!",
  recipient_required: "¡Por favor, seleccione un destinatario!",
  recipient_not_found: "¡Destinatario no encontrado!",
  cannot_send_to_self: "¡No puede enviarse mensajes a sí mismo!",
  select_community: "Seleccionar comunidad",
  community_not_found: "¡Comunidad no encontrada!",
  no_users_in_community: "¡No hay otros usuarios en esta comunidad!",
  no_other_users: "¡No hay otros usuarios en el sistema!",
  invalid_message_type: "¡Tipo de mensaje inválido!",
  new_message: "Nuevo mensaje",
  you_have_new_message_from: "Tiene un nuevo mensaje de",
  error_sending_message: "Error enviando mensaje",
  no_permission_send_messages: "Sin permiso para enviar mensajes. ¡Revise las reglas de Firestore!",
  no_internet_connection: "¡Sin conexión a internet! Por favor, intente nuevamente.",
  try_again: "Por favor, intente nuevamente.",
  message_sent_to: "Mensaje enviado a",
  recipients: "destinatarios",
  recipient: "destinatario",
  error_starring_message: "Error marcando mensaje",
  archived: "Archivado",
  error_archiving_message: "Error archivando mensaje",
  confirm_delete_message: "¿Eliminar este mensaje?",
  message_moved_to_trash: "¡Mensaje movido a la papelera!",
  error_deleting_message: "Error eliminando mensaje",
  delete_selected_messages: "Eliminar mensajes seleccionados",
  selected_messages: "mensajes seleccionados",
  messages_moved_to_trash: "mensajes movidos a la papelera",
  error_deleting_messages: "Error eliminando mensajes",
  permanent_delete_confirm: "Este mensaje será eliminado permanentemente. ¿Continuar?",
  message_permanently_deleted: "¡Mensaje eliminado permanentemente!",
  error_permanent_delete: "Error durante eliminación permanente",
  error_marking_message: "Error marcando mensaje",
  no_unread_messages: "¡No hay mensajes no leídos!",
  messages_marked_as_read: "mensajes marcados como leídos",
  error_marking_messages: "Error marcando mensajes",
  loading_messages: "Cargando mensajes...",
  messages_center: "Mensajes",
  unread: "no leídos",
  total: "total",
  in_community: "en comunidad",
  mark_all_read: "Marcar todo como leído",
  good_logic: "Buena estructura lógica",
  improve_comments: "Mejorar comentarios",
  grade_assignment: "Calificar Tarea",
  saving: "Guardando...",
  no_file_selected: "Ningún archivo seleccionado",
  grade_all_work: "Calificar Todo el Trabajo",
  my_grades: "Mis Calificaciones",
  view_all_grades: "Ver Todas las Calificaciones",
  refresh_grades: "Actualizar Calificaciones",
  click_to_view_grades: "Haga clic para ver calificaciones",
  see_detailed_grades_feedback: "Ve todas tus calificaciones y comentarios detallados de los profesores",
  open_grades_view: "Abrir Vista de Calificaciones",
  grades_received: "Calificaciones Recibidas",
  no_grades_yet: "Aún no hay calificaciones",
  complete_assignments_to_get_grades: "Completa tareas para obtener calificaciones",
  total_grades: "Calificaciones Totales",
  average_grade: "Calificación Promedio",
  excellent_grades: "Calificaciones Excelentes",
  rate: "Calificar",
  remove_from_favorites: "Eliminar de favoritos",
  add_to_favorites: "Agregar a favoritos",
  graded_by: "Calificado por",
  recently: "Recientemente",
  viewing_grade_details: "Viendo Detalles de Calificación",
  full_feedback: "Comentario Completo",
  score: "Puntuación",
  grade_distribution: "Distribución de Calificaciones",
  mark_all: "Marcar todo",
  new: "Nuevo",
  all: "Todos",
  community: "Comunidad",
  community_members: "Miembros de la comunidad",
  all_users: "Todos los usuarios",
  teachers: "Profesores",
  message_to_community: "Mensaje a la comunidad",
  user_list: "Lista de usuarios",
  found: "encontrados",
  student: "Estudiante",
  no_users_found: "No se encontraron usuarios",
   remove_bookmark: "Eliminar marcador",
  like: "Me gusta",
  important: "Importante",
  select_all: "Seleccionar todo",
  delete: "Eliminar",
  no_new_messages: "No hay nuevos mensajes",
  no_messages_found: "No se encontraron mensajes",
  no_messages_inbox: "Cuando reciba mensajes, aparecerán aquí",
  try_different_folder: "Intente con una carpeta diferente o búsqueda",
  me: "Yo",
  broadcast: "Todos",
  no_activity_data: "No hay datos de actividad disponibles",
  grades: "Calificaciones",
your_learning_communities: "Tus Comunidades de Aprendizaje",
join_community_with_code: "Unirse a Comunidad con Código",
lessons_available: "Lecciones Disponibles",
no_lessons_found: "No se encontraron lecciones",
solutions_found: "Soluciones Encontradas",
activity_chart: "Gráfico de Actividad",
solutions: "Soluciones",
  
  // Дни от седмицата (съкратени)
  monday_short: "Lun",
  tuesday_short: "Mar",
  wednesday_short: "Mié",
  thursday_short: "Jue",
  friday_short: "Vie",
  saturday_short: "Sáb",
  sunday_short: "Dom",
  community_message: "Mensaje a la comunidad",
  broadcast_message: "Mensaje a todos",
  original_message: "Mensaje original",
  reply: "Responder",
  forwarded_message: "Mensaje reenviado",
  forward: "Reenviar",
  permanent_delete: "Eliminar permanentemente",
  message_to_all: "Mensaje a todos",
  message_type: "Tipo de mensaje",
  personal: "Personal",
  sending_to: "Enviando a",
  no_lessons_yet: "Aún no hay lección",
create_first_lesson: "Crear la primera lección",
  message_to_community_desc: "Este mensaje será enviado a todos",
  users_on_platform: "usuarios en la plataforma",
  username_or_email: "Nombre de usuario o correo",
  subject: "Asunto",
  message_subject: "Asunto del mensaje",
  write_message_here: "Escriba su mensaje aquí...",
  cancel: "Cancelar",
  sending: "Enviando...",
  send: "Enviar",
  search_messages: "Buscar mensajes...",
  deselect: "Deseleccionar",
  mark_as_read: "Marcar como leído",
  delete_message: "Eliminar mensaje",
  message: "Mensaje",
  to: "a",
  new_challenge: "Nuevo desafío",
  new_challenge_notification: "Nuevo desafío",
  new_challenge_available: "Nuevo desafío disponible",
  new_assignment_notification: "Nueva tarea",
 
  view_feedback: "Ver comentarios",
  evaluated_by: "Evaluado por",
  code_copied: "¡Código copiado al portapapeles!",
  no_code_to_copy: "No hay código para copiar",
  your_name: "Tu nombre",
  new_assignment: "Nueva tarea",
  show_less: "Mostrar menos",
  active_challenge: "Desafío activo",
    unexpected_error: 'Ocurrió un error inesperado',
    status_success: 'Éxito',
    status_error: 'Error',
    status_pending: 'Pendiente',
    select_folder: 'Seleccionar Carpeta de Destino:',
    drag_drop_file: 'Arrastra y suelta tu archivo .pl aquí',
    or_click_browse: 'o haz clic para buscar',
    upload_to_folder: 'Subir a',
    clear_selection: 'Limpiar Selección',
    only_pl_files_info: 'Solo se permiten archivos .pl',
    files_saved_in: 'Los archivos se guardarán en:',
    recent_submissions: 'Envíos Recientes',
    success_filter: 'Exitosos',
    files_filter: 'Archivos',
    no_submissions: 'Aún no hay envíos',
    start_uploading: '¡Comienza subiendo tu primer código o archivo Prolog!',
    upload_first_code: 'Subir Primer Código',
    no_code_preview: 'No hay vista previa del código disponible...',
    view_details: 'Ver Detalles',
    run_again: 'Ejecutar Otra Vez',
    created_new_challenge: "Creó un nuevo desafío",
has_been_accepted: "Ha sido aceptado",
challenge_response: "Respuesta al desafío",
responded_to: "Respondió a",
has_been_completed: "Ha sido completado",
challenge_notification_sent: "Notificación de desafío enviada",
sent_notifications: "Notificaciones enviadas",
    what_to_teach: "¿Qué quieres enseñar hoy?",
all_time_submissions: "Todas las entregas",
completed_submissions: "Entregas completadas",
total_files_uploaded: "Total de archivos subidos",
overall_success_rate: "Tasa de éxito general",
all_visibility: "Todas las visibilidades",
no_messages: "No tienes mensajes",
  mark_all_as_read: "Marcar todos",
  messages_as_read: "mensajes como leídos",
  all_messages_marked_as_read: "Todos los mensajes marcados como leídos",
  error_updating_messages: "Error actualizando mensajes",
  no_read_messages: "No tienes mensajes leídos",
  delete_read_messages: "Eliminar mensajes leídos",
  read_messages: "mensajes leídos",
  messages_deleted: "Mensajes eliminados",
  delete_all_messages: "Eliminar todos los mensajes",
  open_messages: "Abrir Mensajes",
new_today: "Nuevo Hoy",
assignment: "Tarea",
course: "Curso",
file: "Archivo",
grading: "Calificación",
ago: "hace",
add_new_assignment: "Agregar Nueva Tarea",
top_students: "Mejores Estudiantes",
avg: "Prom",
recommendations: "Recomendaciones",
my_lessons: "Mis Lecciones",
manage_organize_lessons: "Gestiona y organiza tus lecciones",
add_new_lesson: "Agregar Nueva Lección",
preview: "Vista previa",
manage_create_assignments: "Gestiona y crea nuevas tareas",
add_assignment: "Agregar Tarea",
upload_first_file: "Sube tu primer archivo",
no_email: "Sin correo",
na: "N/D",
no_activity: "Sin actividad",
    no_student_activities: "Aún no hay actividades de estudiantes",
    lesson_title_required: "El título de la lección es obligatorio",
    
    registered_students: "Estudiantes registrados",
    pending_approvals: "Aprobaciones pendientes",
    waiting_for_review: "Esperando revisión",
    student_performance: "Rendimiento estudiantil",
    lesson_progress: "Progreso de lecciones",
    completed_lessons: "Lecciones completadas",
    
    student_activities: "Actividades de estudiantes",
    recent_assignments: "Tareas recientes",
    last_activity: "Última actividad",
    
    lesson_title: "Título de la lección",
    enter_lesson_title: "Ingrese título de la lección",
    description: "Descripción",
    enter_description: "Ingrese descripción (opcional)",
    
    add_lesson: "Agregar lección",
no_files_uploaded: "Este estudiante no ha subido archivos todavía.",
add_detailed_feedback: "Añadir retroalimentación detallada...",
example_expert_system: "Ejemplo: Crear un Sistema Experto",
example_insects: "Ejemplo: Insectos, Reacciones Químicas, Electricidad",
describe_objective: "Describe el objetivo de la tarea...",
brief_description: "Breve descripción de la tarea...",
instructions: "Instrucciones",
add_instruction: "Agregar Instrucción",
enter_instruction: "Introduce instrucción...",
minimum_facts: "Hechos Mínimos",
minimum_rules: "Reglas Mínimas",
create_new_assignment: "Crear Nueva Tarea",
challenge_algorithms: "Desafío de Algoritmos",
new_course_ml: "Nuevo Curso: Aprendizaje Automático",
student_file_project: "Archivo del Estudiante: project.pl",
homework_check: "Revisión de Tareas",
visual_examples: "Ejemplos Visuales",
visual_examples_desc: "Los estudiantes responden muy bien a gráficos y diagramas.",
apply: "Aplicar",
group_work: "Trabajo en Grupo",
group_work_desc: "Comienza una tarea grupal durante los próximos 15 minutos.",
start: "Comenzar",
short_break: "Descanso Corto",
short_break_desc: "La atención está decayendo - un descanso de 2 minutos ayudaría.",
create: "Crear",
about_us:"Sobre nosotros",
prolog_demo:"Demostración de Prolog",
// Категории
    prolog_programming: "Programación Prolog",
    artificial_intelligence: "Inteligencia Artificial",
    databases: "Bases de Datos",
    algorithms: "Algoritmos",
    logic_programming: "Programación Lógica",
    
    // Заглавия и подзаглавия
    learning_topics: "Temas de Aprendizaje",
    explore_materials: "Explora materiales educativos",
    all_topics: "Todos los Temas",
    all_learning_topics: "Todos los Temas de Aprendizaje",
    explore_category_topics: "Explora temas de categoría",
    browse_all_topics: "Navega por todos los temas de aprendizaje disponibles",
    topics_completed: "Temas Completados",
    lessons_completed: "Lecciones Completadas",
    
    // Бърз достъп и менюта
    quick_access: "Acceso Rápido",
    search_topics: "Buscar temas...",
    categories: "Categorías",
    sort_by_rating: "Ordenar por Puntuación",
  sort_by_views: "Ordenar por Vistas",
  sort_by_date: "Ordenar por Fecha",
  
  // Филтри
  all_difficulties: "Todas las Dificultades",
  
  // Статистики
  total_views: "Vistas Totales",
  
    
    // Статуси и действия
    start_learning: "Comenzar a Aprender",
    start_course: "Iniciar Curso",
    start_lesson: "Iniciar Lección",
    review_lesson: "Revisar Lección",
    ask_ai_about_topic: "Pregunta a la IA sobre este tema",
    ask_ai_about_lesson: "Pregunta a la IA sobre esta lección",
    bookmark_lesson: "Marcar esta lección",
    
    // Зареждане и съобщения
    loading_topics: "Cargando temas...",
    no_topics_found: "No se encontraron temas",
    no_topics_for_category: "No hay temas disponibles para esta categoría todavía",
    select_topic_prompt: "Selecciona un tema para ver lecciones",
    choose_topic_from_list: "Elige un tema de la lista para ver lecciones disponibles",
    no_lessons_available: "No hay lecciones disponibles",
    no_lessons_for_topic: "No hay lecciones disponibles para este tema todavía",
    

    course_lessons: "Lecciones del Curso",
     no_permission_delete: "No tienes permiso para eliminar este mensaje",
  message_deleted: "Mensaje eliminado exitosamente",
  messages_processed: "Mensajes procesados",
    
    // Prolog Guide
    
    
    // Табове
    tab_basics: "Básicos",
    tab_examples: "Ejemplos",
    tab_tutorials: "Tutoriales",
    tab_resources: "Recursos",
    
    // Основи на Prolog - заглавия
    basics_facts_title: "Hechos",
    basics_rules_title: "Reglas",
    basics_queries_title: "Consultas",
    please_login: "Por favor, inicie sesión para continuar",
    
    // Основи на Prolog - описания
    basics_facts_desc: "Los hechos son afirmaciones verdaderas sobre el mundo. Forman la base de tu base de conocimientos.",
    basics_rules_desc: "Las reglas definen relaciones lógicas entre hechos. Consisten en una cabeza y un cuerpo.",
    basics_queries_desc: "Las consultas hacen preguntas sobre tu base de conocimientos. Prolog intenta probarlas como verdaderas.",
    
    // Основи на Prolog - точки
    basics_facts_p1: "Terminan con un punto (.)",
    basics_facts_p2: "Usa minúsculas para predicados",
    basics_facts_p3: "Pueden tener múltiples argumentos",
    basics_facts_p4: "Representan relaciones",
    
    basics_rules_p1: "Sintaxis Cabeza :- Cuerpo",
    basics_rules_p2: "El cuerpo contiene objetivos",
    basics_rules_p3: "La coma (,) significa Y",
    basics_rules_p4: "El punto y coma (;) significa O",
    user: 'Usuario',
    message_to_all_desc: 'Este mensaje será enviado a todos los usuarios de la plataforma',
    
    basics_queries_p1: "Comienzan con el símbolo ?-",
    basics_queries_p2: "Las variables comienzan con mayúscula",
    basics_queries_p3: "Obtén múltiples soluciones",
    basics_queries_p4: "Usa backtracking",
     students_in_my_communities: "Estudiantes en mis comunidades",
  assignments_created_by_me: "Tareas creadas por mí",
  in_system: "En el sistema",
  other_teachers_in_system: "Otros profesores en el sistema",
  my_students_activities: "Actividades de Mis Estudiantes",
    close: "Cerrar",
    download_code: "Descargar código",
    download: "Descargar",
    view_grade: "Ver calificación",
    view_download_submissions: "Ver y descargar tus entregas",
    new_submission: "Nueva entrega",
    resubmit: "Volver a enviar",
    
    graded_on: "Calificado el",
    submitted_on: "Entregado el",
    pending_evaluation: "Evaluación pendiente",
    all_grades: "Todas las calificaciones",
evaluation: "Evaluación",
    
    completed: "Completado",
    assignment_not_graded: "Esta tarea aún no ha sido calificada",
    access_denied: "Acceso Denegado",
  teacher_only: "Esta área solo es accesible para profesores",
  logout_failed: "Error al cerrar sesión. Por favor, intente de nuevo.",
  error_loading_lessons: "Error al cargar las lecciones",
  error_loading_grades: "Error al cargar las calificaciones",
  error_loading_challenge_stats: "Error al cargar estadísticas de desafíos",
  error_marking_read: "Error al marcar como leído",
  error_marking_all_read: "Error al marcar todos como leídos",
  error_marking_notifications: "Error al actualizar notificaciones",
  error_loading_activity: "Error al cargar actividad",
  error_sending_notification: "Error al enviar notificación",
  error_adding_activity: "Error al agregar actividad",
  error_loading_thread: "Error al cargar el hilo de mensajes",
  error_opening_file: "Error al abrir archivo",
  error_downloading_file: "Error al descargar archivo",
  error_details: "Detalles del Error",
  
  // Задания и предизвикателства
  total_challenges: "Total Desafíos",
  pending_challenges: "Desafíos Pendientes",
  in_draft: "En Borrador",
  no_active_challenges: "No hay desafíos activos",
  recent_challenges: "Desafíos Recientes",
  completion: "Finalización",
  avg_score: "Punt. Prom",
  respond: "Responder",
  accepted_students: "Estudiantes Aceptados",
  completed_students: "Estudiantes Completados",
  attachments_cannot_be_forwarded: "Los archivos adjuntos no se pueden reenviar. Vuelva a subirlos si es necesario.",
  created_by: "Creado por",
  
  // Нива
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
  
  // Общности
  total_communities: "Total Comunidades",
  new_community: "Nueva Comunidad",
  no_communities: "Aún no hay comunidades",
  community_activity: "Actividad de la Comunidad",
  no_community_activity: "Sin actividad en la comunidad",

  recent_lessons: "Lecciones Recientes",
  create_first: "Crear Primero",
  
  // Съобщения и поща
  mailbox: "Buzón",
  recent_messages: "Mensajes Recientes",
  total_messages: "Total Mensajes",
  no_files: "Sin archivos",
  
  // Студенти
  students_in_system: "Estudiantes en el Sistema",
  student_list: "Lista de Estudiantes",
  all_students: "Todos los Estudiantes",
  no_student_data: "No hay datos de estudiantes disponibles",
  
  // Файлове и качване
  drag_drop: "Arrastra y suelta archivos aquí",
  upload: "Subir",
  
  // Основни навигационни секции
  main: "Principal",
  learning: "Aprendizaje",
  content: "Contenido",
  activity: "Actividad",
  
  // Форми и въвеждане
  name: "Nombre",
  enter_name: "Ingrese nombre",
  
  // Примери
  grade_example: "ej., 9° Grado",
  subject_example: "ej., Matemáticas",
  
  // Табло и статистики
  dashboard_description: "Resumen de tus actividades de aprendizaje y progreso",
  recent_grades: "Calificaciones Recientes",
  no_recent_grades: "No hay calificaciones recientes",
  bookmark: "Marcador",
    
    assignment_evaluation: "Evaluación de tarea",
    
    code_execution_success: "Ejecución de código exitosa",
    active_streak: "Racha activa",
    consecutive_days_active: "Días activos consecutivos",
    keep_it_up: "¡Sigue así!",
    pending_assignments: "Pendientes",
    needs_submission: "Necesita entrega o evaluación",
    requires_attention: "Requiere atención",
    
    no_recent_activity: "Sin actividad reciente",
    // Примери на код
    prolog_basics_title: "Básicos de Prolog",
    prolog_basics_desc: "Hechos y Reglas en Prolog",
    prolog_basics_expl: "Los hechos representan afirmaciones verdaderas. Las reglas definen relaciones entre hechos. Las consultas hacen preguntas sobre la base de conocimientos.",
    
    prolog_recursion_title: "Recursión en Prolog",
    prolog_recursion_desc: "Reglas Recursivas para Navegación",
    prolog_recursion_expl: "La recursión es esencial en Prolog. La regla de antepasado se llama a sí misma para encontrar relaciones indirectas.",
    
    prolog_lists_title: "Trabajo con Listas",
    prolog_lists_desc: "Manipulación de Listas en Prolog",
    prolog_lists_expl: "Las listas son estructuras de datos fundamentales en Prolog. Utilizan notación cabeza-cola para procesamiento recursivo.",
    
    // Уроци
    tutorial_structure_title: "Estructura del Programa",
    tutorial_structure_content: "Cada programa Prolog consta de tres partes principales: hechos, reglas y consultas. Los hechos son verdades incondicionales, las reglas definen relaciones lógicas y las consultas hacen preguntas.",
    tutorial_structure_ex1: "Comienza con hechos simples sobre tu dominio",
    tutorial_structure_ex2: "Define reglas que conecten hechos lógicamente",
    tutorial_structure_ex3: "Escribe consultas para probar tu base de conocimientos",
    tutorial_structure_ex4: "Usa comentarios (%) para documentar tu código",
    
    tutorial_variables_title: "Variables y Unificación",
    tutorial_variables_content: "Las variables en Prolog comienzan con letras mayúsculas. La unificación es el proceso de emparejar variables con valores. Así es como Prolog encuentra soluciones a las consultas.",
    tutorial_variables_ex1: "Las variables se unifican con cualquier término",
    tutorial_variables_ex2: "La variable anónima _ coincide con cualquier cosa una vez",
    tutorial_variables_ex3: "Usa la misma variable para requerir el mismo valor",
    tutorial_variables_ex4: "Las variables se instancian durante la ejecución",
    join_communities: 'Unirse a Comunidades',
  join_community_dashboard: 'Únete a comunidades desde el panel',
  community_join_info: 'Después de unirte a comunidades desde el panel',
  community_creation_note: 'Después de la aprobación, puedes crear una comunidad',
  community_creation_help: 'Podrás crear una comunidad de aprendizaje, invitar estudiantes y organizar desafíos',
    tutorial_backtracking_title: "Backtracking y Búsqueda",
    tutorial_backtracking_content: "Prolog usa búsqueda en profundidad con backtracking. Cuando un objetivo falla, Prolog vuelve al último punto de elección e intenta soluciones alternativas.",
    tutorial_backtracking_ex1: "Se encuentran múltiples soluciones una por una",
    tutorial_backtracking_ex2: "Usa punto y coma (;) para encontrar todas las soluciones",
    tutorial_backtracking_ex3: "El corte (!) previene el backtracking",
    tutorial_backtracking_ex4: "fail fuerza el backtracking",
    view_template: "Ver plantilla de código",
    // Бързи съвети
    quick_tips_title: "Consejos Rápidos para Principiantes",
    quick_tips_subtitle: "Consejos esenciales para comenzar con Prolog",
    tip_1: "Comienza con hechos simples antes de reglas complejas",
    tip_2: "Usa nombres de predicados significativos",
    tip_3: "Prueba cada regla independientemente",
    tip_4: "Lee los mensajes de error cuidadosamente",
    
    // Файлови операции
    view_code_for_domain: "Ver Código del Dominio",
    upload_new_file_to: "Subir Nuevo Archivo a",
    
    // Валидация
    name_required: "Por favor, ingresa tu nombre completo",
    institution_required: "Por favor, ingresa tu institución",
    email_required: "Por favor, ingresa tu correo electrónico",
    enter_full_name: "Ingresa tu nombre completo",
    select_role: "Selecciona Tu Rol",
    teacher_approval_note: "Los perfiles de profesor requieren aprobación del administrador",
    enter_institution: "Escuela/Universidad/Institución",
    grade_course: "Grado/Curso",
    enter_grade: "Grado/Curso (opcional)",
    specialty: "Especialidad",
    enter_specialty: "Asignatura/Especialidad (opcional)",
    create_password: "Crea una contraseña (mín. 6 caracteres)",
    challenge_response_on: "Respuesta en",
  challenge_reject: "Rechazar Desafío",
  published: "Publicado",
  all_lessons: "Todas las lecciones",
  search_lessons: "Buscar lecciones...",
  total_lessons: "Total de lecciones",
  no_matching_lessons: "No se encontraron lecciones que coincidan",
  try_changing_criteria: "Intente cambiar los criterios de búsqueda o filtro",
   stats_icon_chart: "📊",
stats_icon_check: "✓",
stats_icon_warning: "⚠",
stats_icon_star: "⭐",
stats_icon_trophy: "🏆",
stats_icon_users: "👥",
stats_icon_activity: "📈",
  // Задания и работа
  continue_work: "Continuar trabajo",
  start_assignment: "Comenzar tarea",
  creating: "Creando",
  accept: "Aceptar",
  example_code_hint: "Sugerencia de código de ejemplo",
  
  // Съобщения и дискусии
  message_thread: "Hilo de mensaje",
  start_conversation: "Comience la conversación enviando un mensaje a continuación",
  type_message: "Escriba su mensaje...",
  just_now: "Justo ahora",
  all_messages_read: "¡Todos los mensajes marcados como leídos!",
  messages_sent: "mensaje(s) enviado(s) exitosamente",
  message_all: "Mensaje a todos",
  student_wants_to_join: "{student} quiere unirse a '{community}'",
  join_request: "Solicitud de unión",
  
  // Управление на уроци
  lesson_updated: "¡Lección actualizada exitosamente!",
  lesson_created: "¡Lección creada exitosamente!",
  error_saving_lesson: "¡Error al guardar la lección!",
  confirm_delete_lesson: "¿Está seguro de que desea eliminar esta lección?",
  lesson_deleted: "¡Lección eliminada exitosamente!",
  error_deleting_lesson: "¡Error al eliminar la lección!",
  programming: "Programación",
  new_lesson_created: "Nueva lección creada",
  
  // Предизвикателства и общности
  need_community_for_challenges: "Necesita crear una comunidad antes de poder crear desafíos.",
  no_community_selected: "Ninguna comunidad seleccionada",
  select_community_for_challenges: "Por favor, seleccione una comunidad de la pestaña Comunidades para ver y gestionar desafíos.",
  go_to_communities: "Ir a Comunidades",
  challenge_sent: "Desafío",
  sent_successfully: "enviado exitosamente",
  
  // Оценяване и обратна връзка
  grade_notification: 'Su trabajo "{file}" ha sido calificado. Puntos: {points}/10. Comentarios: {feedback}',
  grade_assigned: "Calificación asignada",
  grade_assigned_details: 'Asignados {points}/10 puntos por "{file}"',
  error_saving_grade: "¡Error al guardar la calificación! Verifique la consola para más detalles.",
  graded: "calificados",
  unknown_student: "Estudiante desconocido",
  
  // Управление на общности
  community_created: "¡Comunidad creada exitosamente!",
  error_creating_community: "¡Error al crear la comunidad!",
  student_approved: "¡Estudiante aprobado exitosamente!",
  error_approving_student: "¡Error al aprobar estudiante!",
  request_rejected: "¡Solicitud rechazada!",
  error_rejecting_request: "¡Error al rechazar la solicitud!",
  id: "ID",
  
  // Активности и действия
  created_expert_system: "Sistema experto creado para proyecto de biología",
  uploaded_assignment: "Archivo de tarea subido",
  completed_logical_rules: "Tarea de reglas lógicas completada",
    
    // Текстове от интерфейса
    join_community: "Únete a la",
    register_description: "Comienza tu viaje en educación STEM impulsada por IA y explora conceptos de programación interactiva.",
    start_journey: "Comienza tu viaje de aprendizaje STEM hoy",
    send_updates: "Envíame recursos educativos y actualizaciones",
    // Нови dashboard преводи
    welcome_subtitle: 'Aquí está tu progreso de aprendizaje y las actividades próximas',
    search_placeholder: 'Buscar cursos, lecciones...',
    learning_platform: 'Plataforma de Aprendizaje',
    my_courses: 'Mis Cursos',
    assignments: 'Tareas',
    progress: 'Progreso',
    settings: 'Configuración',
    learning_progress: 'Progreso de Aprendizaje',
    week: 'Semana',
    month: 'Mes',
    year: 'Año',
    all_time: 'Todo el tiempo',
    completion_rate: 'Tasa de Finalización',
    total_study_hours: 'Horas Totales de Estudio',
    completed_tasks: 'Tareas Completadas',
    streak_days: 'Días Consecutivos',
    progress_over_time: 'Progreso en el Tiempo',
    skill_distribution: 'Distribución de Habilidades',
    recent_activity: 'Actividad Reciente',
    completed_assignment: 'Tarea completada',
    uploaded_file: 'Archivo subido',
    achieved_milestone: 'Hito alcanzado',
    browse_files: 'Examinar Archivos',
    or: 'o',
    upload_to: 'Subir a',
    make_first_submission: 'Haz tu primer envío',
    all_assignments: 'Todas las Tareas',
    in_progress: 'En Progreso',
    pending: 'Pendiente',
    due: 'Fecha límite',
    tasks: 'tareas',
    details: 'Detalles',
    continue_learning: 'Continuar Aprendiendo',
    complete: 'Completado',
    weekly_progress: 'Progreso Semanal',
    weekly_completion: 'Tasa de finalización semanal',
    learning_hours: 'Horas de Aprendizaje',
    daily_study_hours: 'Horas de estudio diarias esta semana',
    my_assignments: 'Mis Tareas',
    articles: 'Artículos',
    view_all: 'Ver Todo',
    from: "de",
  my_challenge_solutions: "Mis Soluciones de Desafíos",
  no_solutions_yet: "Aún no hay soluciones",
  join_challenges_to_solve: "¡Únete a desafíos para comenzar a resolver!",
  browse_challenges: "Explorar Desafíos",
  view_solution: "Ver Solución",
  continue_solving: "Continuar Resolviendo",
  message_community: "Mensaje a la Comunidad",
  messages: "Mensajes",
  type_message_here: "Escriba mensaje aquí...",
  select_recipient: "Seleccionar destinatario",
  message_history: "Historial de Mensajes",
  you: "Tú",
  no_messages_yet: "Aún no hay mensajes",
   in_my_community: "en mi comunidad",
  error_loading_community: "Error cargando comunidad",
   challenge_not_found: "Desafío no encontrado",
  already_joined_challenge: "Ya te has unido a este desafío",
  select_challenge_first: "Por favor, seleccione un desafío primero",
  code_empty: "El código no puede estar vacío",
  challenge_not_joined: "Aún no te has unido a este desafío",
  challenge_submitted: "Solución del desafío enviada exitosamente",
  challenge_submission_error: "Error al enviar la solución del desafío",
  select_assignment_first: "Por favor, seleccione una tarea primero",
  assignment_not_found: "Tarea no encontrada",
  submit_challenge_solution: "Enviar Solución del Desafío",
  challenge_mode: "Modo Desafío",
  current_challenge: "Desafío Actual",
  challenge_mode_active: "El modo desafío está activo",
  exit_challenge_mode: "Salir del Modo Desafío",
  no_challenge_selected: "Ningún desafío seleccionado",
  select_challenge_first_desc: "Seleccione un desafío para comenzar a resolver",
  go_to_challenges: "Ir a Desafíos",
  switch_to_assignments: "Cambiar a Tareas",
  switch_to_challenges: "Cambiar a Desafíos",
  submit_solution: "Enviar Solución",
  no_community: "Sin comunidad",
  remove_star: "Quitar estrella",
  star: "Estrella",
  select_message: "Seleccione un mensaje",
  select_message_to_view: "Seleccione un mensaje para ver detalles",
  to_community: "a la comunidad",
  communities: "Comunidades",
    // Login page преводи
    login_description: "Continúa tu viaje en la educación STEM impulsada por IA y explora conceptos de programación interactivos.",
    access_projects: "Accede a tus proyectos",
    track_progress: "Sigue tu progreso",
    collaborate_peers: "Colabora con compañeros",
    sign_in_account: "Iniciar sesión en tu cuenta",
    enter_credentials: "Ingresa tus credenciales para continuar aprendiendo",
    email_address: "Dirección de correo electrónico",
    enter_email: "Ingresa tu correo electrónico",
    password: "Contraseña",
    enter_password: "Ingresa tu contraseña",
    remember_me: "Recordarme",
    forgot_password: "¿Olvidaste la contraseña?",
    signing_in: "Iniciando sesión...",
    sign_in_ideas: "Iniciar sesión en IDEAS",
    new_to_ideas: "¿Nuevo en IDEAS?",
    create_account: "Crear una cuenta",
    terms_agreement: "Al continuar, aceptas nuestros",
    and: "y",
    
    // Register page преводи
    register_title: "Únete a la Comunidad IDEAS",
    register_journey_title: "Comienza tu viaje de aprendizaje STEM hoy",
    register_platform_description: "Comienza tu viaje en la educación STEM impulsada por IA y descubre el mundo de la programación lógica y la inteligencia artificial.",
    join_platform: "Únete a la",
    interactive_tutorials: "Tutoriales interactivos",
    hands_on_projects: "Proyectos prácticos",
    collaborative_learning: "Aprendizaje colaborativo",
    progress_tracking: "Seguimiento del progreso",
    create_your_account: "Crea tu cuenta",
    start_stem_journey: "Comienza tu viaje de aprendizaje STEM hoy",
    confirm_password: "Confirmar contraseña",
    confirm_password_placeholder: "Confirma tu contraseña",
    password_placeholder: "Crea una contraseña (mín. 6 caracteres)",
    i_agree_to: "Acepto los",
    send_me_updates: "Envíame recursos educativos y actualizaciones",
    quick_message: "Mensaje Rápido",
  quick_message_desc: "Enviar un mensaje rápido a estudiantes o comunidades",
  open_mail: "Abrir Correo",
  broadcast_all_students: "Transmitir a Todos los Estudiantes",
  type_your_message_here: "Escriba su mensaje aquí...",
  new_messages: "Nuevos Mensajes",
  mark_all_read_confirm: "¿Marcar todos los mensajes como leídos?",
  click_to_mark_read: "Haga clic para marcar como leído",
  view_all_messages: "Ver Todos los Mensajes",
    creating_account: "Creando cuenta...",
    create_ideas_account: "Crear cuenta IDEAS",
    already_have_account: "¿Ya tienes una cuenta?",
    sign_in_existing: "Iniciar sesión en cuenta existente",
    register_footer_text: "Al crear una cuenta, aceptas nuestras políticas de plataforma y directrices educativas.",
    
    // Validation messages преводи
    manage_learning_communities: "Administra tus comunidades de aprendizaje",
  create_community: "Crear Comunidad",
  create_first_community: "Crear Primera Comunidad",
  pending_requests: "Solicitudes Pendientes",
  manage_community_challenges: "Administra y crea desafíos entre comunidades",
  create_challenge: "Crear Desafío",
  create_first_challenge: "Crear Primer Desafío",
  communities_overview: "Resumen de Comunidades",
  no_communities_dashboard: "Aún no has creado ninguna comunidad",
  view_all_communities: "Ver Todas las Comunidades",
  community_name: "Nombre de la Comunidad",
  enter_community_name: "Ingrese nombre de la comunidad",
  grade_level: "Nivel de Grado",
  unlisted: "No listado",
  has_been_published: "Ha sido publicado",
  open_in_assignments: "Abrir en Tareas",
  and_notified: "y notificado",
  assignment_created_action: "Tarea Creada",
  created_new_assignment: "Nueva tarea creada",
  students_notified: "Estudiantes notificados",
  privacy_settings: "Configuración de Privacidad",
  private: "Privado",
  public: "Público",
  auto_approve_students: "Aprobar automáticamente solicitudes de unión de estudiantes",
  allow_student_messages: "Permitir a estudiantes enviarse mensajes",
  allow_student_challenges: "Permitir a estudiantes crear desafíos",
  allow_inter_community_challenges: "Permitir desafíos entre comunidades",
  challenge_title: "Título del Desafío",
  enter_challenge_title: "Ingrese título del desafío",
  target_community: "Comunidad Objetivo",
  send_challenge: "Enviar Desafío",
    password_mismatch: "Las contraseñas no coinciden",
    password_too_short: "La contraseña debe tener al menos 6 caracteres",
    password_weak: "La contraseña es demasiado débil",
    email_in_use: "Este correo ya está en uso",
    invalid_email: "Correo electrónico inválido",
    solution_submitted: "¡Solución del desafío enviada exitosamente!",
  solution_error: "Error al enviar la solución",
  join_request_sent: "¡Solicitud de unión enviada!",
  join_request_error: "Error al enviar solicitud de unión",
  invalid_invite_code: "Código de invitación inválido",
  join_error: "Error al unirse",
  message_sent: "¡Mensaje enviado exitosamente!",
  message_error: "Error al enviar mensaje",
  challenge_joined_success: "¡Desafío unido! Ahora puedes trabajar en tu solución.",
  challenge_join_error: "Error al unirse al desafío",
  my_solutions: "Mis Soluciones",
  challenges: "Desafíos",
  learning_communities: "Comunidades de aprendizaje",
  challenges_in_progress: "Desafíos en progreso",
  enter_invite_code: "Ingrese código de invitación",
  join: "Unirse",
  my_communities: "Mis Comunidades",
  no_communities_yet: "Aún no hay comunidades",
  join_community_description: "Únete a comunidades existentes o crea la tuya propia",
  members: "miembros",
  general: "General",
  view_challenges: "Ver Desafíos",
  mountains: "Montañas",
  active_challenges: "Desafíos Activos",
  no_challenges_yet: "Aún no hay desafíos",
  no_challenges_description: "Crea tu primer desafío o espera a que otros comiencen uno",
  participants: "participantes",
  joined: "Unido",
  solve_now: "Resolver Ahora",
  join_challenge: "Unirse al Desafío",
    
    // Register success message
    registration_successful: "¡Registro exitoso! Bienvenido a IDEAS.",
    
    // Theme toggle преводи
    switch_to_light: "Cambiar a tema claro",
    switch_to_dark: "Cambiar a tema oscuro",
    dark_mode: "Modo Oscuro",
    light_mode: "Modo Claro",
    
    // Нови преводи за липсващите ключове
    what_to_learn: "Qué Aprender",
    explore_courses: "Explorar Cursos",
    
    // Нови преводи за PrologChat
    prolog_assistant: 'Asistente AI de Prolog',
    domain_based_knowledge: 'Conocimiento Basado en Dominios',
    chat_stats: 'Estadísticas del Chat',
    active_domain: 'Dominio Activo',
    domain: 'Dominio',
    no_active_domain: 'Sin Dominio Activo',
    knowledge_domains: 'Dominios de Conocimiento',
    clear_domain: 'Limpiar dominio',
    clear_chat: 'Limpiar Chat',
    chat: 'Chat',
    code_preview: 'Vista Previa de Código',
    system_commands: 'Comandos del Sistema',
    file_management: 'Gestión de Archivos',
    enter_filename: 'Ingrese nombre de archivo (ej., animals.pl)',
    file_command_hint: 'Ingrese nombre de archivo arriba, luego haga clic en un comando de archivo',
    responses: 'respuestas',
    expand_chat: 'Expandir chat',
    collapse_chat: 'Contraer chat',
    loading_domain: 'Cargando dominio',
    domain_loaded_success: 'Dominio cargado exitosamente. Listo para consultas.',
    domain_load_error: 'Error cargando dominio',
    thinking: 'Pensando',
    no_server_response: 'Sin respuesta del servidor',
    connection_error: 'Error de conexión',
    select_domain_first: 'Primero seleccione un dominio',
    enter_prolog_query: 'Ingrese consulta Prolog para',
    press_enter_to_send: 'Presione Enter para enviar',
    queries_end_with_period: 'Asegúrese de que las consultas terminen con un punto (.)',
    connected_to: 'Conectado a',
    dashboard_schools: "Escuelas y Usuarios",
dashboard_knowledge: "Bases de Conocimiento",
dashboard_education: "Materiales Educativos",
total_schools: "Escuelas Totales",
active_schools_dash: "Escuelas Activas",
registered_users: "Usuarios Registrados",
active_users_dash: "Usuarios Activos",
biology_bases: "Bases de Biología",
geography_bases: "Bases de Geografía",
mathematics_bases: "Bases de Matemáticas",
chemistry_bases: "Bases de Química",
physics_bases: "Bases de Física",
history_bases: "Bases de Historia",
literature_bases: "Bases de Literatura",
language_bases: "Bases de Idiomas",
live_status: "EN VIVO",
schools_short: "Escuelas",
knowledge_short: "Bases",
education_short: "Materiales",
auto_rotate: "Rotación automática",
growth_trend_schools: "Tendencia de Crecimiento de Escuelas",
growth_trend_knowledge: "Tendencia de Crecimiento de Bases",
growth_trend_education: "Tendencia de Crecimiento de Materiales",
last_7_days: "Últimos 7 días",

    no_domain_selected: 'Sin Dominio Seleccionado',
    select_domain_to_view: 'Seleccione un dominio de la barra lateral para ver sus archivos de código.',
    no_code_files_for: 'No hay archivos de código para',
    upload_code_for_domain: 'Suba archivos de código para este dominio para verlos aquí.',
    files: 'archivos',
    no_domain: 'Sin dominio',
    copy_code: 'Copiar código',
    view_full_code: 'Ver Código Completo',
    api_server: 'API',
    queries: 'Consultas',
    code_files: 'Archivos de Código',
    none: 'Ninguno',
    animals: 'Animales',
    history: 'Historia',
    geography: 'Geografía',
    mineral_water: 'Agua Mineral',
    animal_facts_description: 'Datos y relaciones de animales',
    historical_facts_description: 'Eventos históricos y figuras',
    geographical_facts_description: 'Datos geográficos y ubicaciones',
    mineral_water_description: 'Fuentes y propiedades de agua mineral',
    help: 'Ayuda',
    load_all: 'Cargar Todo',
    list_files: 'Listar Archivos',
    clear_facts: 'Limpiar Hechos',
    current_file: 'Archivo Actual',
    list_predicates: 'Listar Predicados',
    unload_all: 'Descargar Todo',
    consult_file: 'Consultar Archivo',
    reconsult_file: 'Reconsultar Archivo',
    unload_file: 'Descargar Archivo',
    switch_file: 'Cambiar Archivo',
    example_queries: '📚 Consultas de Ejemplo:\n\n',
    quick_links: 'Enlaces Rápidos',
schedule_demo: 'Programar Demo',
explore_community: 'Explorar Comunidad',
made_with_love: 'Hecho con ❤️ para la educación',
    
    // Tooltips
    help_tooltip: 'Mostrar información de ayuda',
    load_all_tooltip: 'Cargar todos los archivos Prolog',
    list_files_tooltip: 'Listar todos los archivos cargados',
    clear_facts_tooltip: 'Limpiar todos los hechos cargados',
    current_file_tooltip: 'Mostrar archivo activo actual',
    list_predicates_tooltip: 'Listar todos los predicados disponibles',
    unload_all_tooltip: 'Descargar todos los archivos Prolog',
    consult_file_tooltip: 'Cargar un archivo Prolog',
    reconsult_file_tooltip: 'Recargar un archivo Prolog',
    unload_file_tooltip: 'Descargar un archivo Prolog',
    switch_file_tooltip: 'Cambiar a otro archivo',
    
    // Балкан преводи
    balkan: 'Balcanes',
    balkan_description: 'Fuentes y propiedades de los Balcanes',
    central_balkan: 'Balcanes Centrales',
    
    // Нови преводи за Header и PrologChat
    file_commands: 'Comandos de Archivo',
    loading: 'Cargando',
    upload_new_file: 'Subir Nuevo Archivo',
    drag_drop_file_to_upload: 'Arrastrar y soltar archivo .pl para subir',
    uploading: 'Subiendo',
    no_file_user_domain: 'No hay archivo seleccionado, usuario no conectado o dominio no seleccionado',
    uploading_file: 'Subiendo archivo...',
    upload_to_domain: 'Subir a dominio',
    code: 'Código',
    file_commands_title: 'Comandos de Archivo',
    class: 'Clase',
    average_points: 'Puntos Promedio',
    actions: 'Acciones',
    grade_saved: 'Calificación guardada',
    for: 'para',
    feedback_saved: '¡Comentario guardado exitosamente!',
    close_window: 'Cerrar Ventana',
    load_assignments_error: 'Error cargando tareas:',
    login_as_teacher: '¡Por favor, inicia sesión como profesor!',
    assignment_updated: '¡Tarea actualizada exitosamente!',
    assignment_created: '¡Tarea creada exitosamente!',
    save_assignment_error: '¡Error guardando tarea!',
    assignment_deleted: '¡Tarea eliminada exitosamente!',
    confirm_delete_assignment: '¿Estás seguro de que quieres eliminar esta tarea?',
    loading_students: 'Cargando estudiantes...',
    no_access_rights: 'Sin derechos de acceso',
    load_students_error: 'Error cargando estudiantes:',
    excellent: 'Excelente',
    good: 'Bueno',
    average: 'Promedio',
    needs_improvement: 'Necesita Mejora',
    poor: 'Pobre',
    load_assignments: 'Cargando tareas...',
    no_assignments_yet: 'Aún no hay tareas',
    create_first_assignment: 'Crear Primera Tarea',
    edit_assignment: 'Editar Tarea',
    create_assignment: 'Crear Nueva Tarea',
    assignment_title: 'Título de la Tarea',
    assignment_title_placeholder: 'Ejemplo: Crear un Sistema Experto',
    topic: 'Tema',
    topic_placeholder: 'Ejemplo: Insectos, Reacciones Químicas, Electricidad',
    biology: 'Biología',
    chemistry: 'Química',
    physics: 'Física',
    other: 'Otro',
    due_date: 'Fecha Límite',
    objective: 'Objetivo',
    objective_placeholder: 'Describa el objetivo de la tarea...',
    description_placeholder: 'Breve descripción de la tarea...',
    background_image: 'Imagen de Fondo',
    category: 'Categoría',
    minimum_requirements: 'Requisitos Mínimos',
    min_facts: 'Hechos Mínimos',
    min_rules: 'Reglas Mínimas',
    combined_rules: 'Reglas Combinadas',
    menu_items: 'Elementos de Menú',
    difficulty: 'Dificultad',
    easy: 'Fácil',
    medium: 'Medio',
    hard: 'Difícil',
    points: 'Puntos',
    example_code: 'Código de Ejemplo',
    example_code_placeholder: 'Puede proporcionar código Prolog de ejemplo...',
    optional: 'opcional',
    save_changes: 'Guardar Cambios',
    create_articles: 'Crear Artículos',
    draft: 'Borrador',
    edit: 'Editar',
    view: 'Ver',
    active_assignments: 'Tareas Activas',
    total_assignments: 'Tareas totales',
    category_statistics: 'Estadísticas por Categoría',
    assignment_distribution: 'Distribución de tareas',
    manage_students_subtitle: 'Revisar entregas de estudiantes y asignar calificaciones',
    search_students: 'Buscar estudiantes...',
    refresh: 'Actualizar',
    export: 'Exportar',
    filter: 'Filtrar',
    please_wait: 'Por favor, espere mientras obtenemos la información del estudiante...',
    no_students_found: 'No se encontraron estudiantes',
    no_students_description: 'No se encontraron estudiantes con archivos subidos en el sistema.',
    last_upload: 'Última Subida',
    avg_points: 'Pts Prom',
    grade: 'Calificar',
    view_files: 'Ver Archivos',
    send_message: 'Enviar Mensaje',
    more_options: 'Más Opciones',
    student_files: 'Archivos del Estudiante',
    file_folder: 'Carpeta',
    file_date: 'Fecha',
    file_size: 'Tamaño',
    view_code: 'Ver Código',
    download_file: 'Descargar Archivo',
    grade_file: 'Calificar Este Archivo',
    no_files_found: 'No se encontraron archivos para este estudiante',
    grade_student: 'Calificar Estudiante',
    assign_points: 'Asignar Puntos',
    selected_points: 'Puntos Seleccionados',
    feedback: 'Comentarios',
    add_feedback_placeholder: 'Agregar comentarios detallados...',
    excellent_work: '¡Excelente Trabajo!',
    needs_correction: 'Necesita Corrección',
    missing_requirements: 'Faltan Requisitos',
    creative_solution: 'Solución Creativa',
    save_grade: 'Guardar Calificación',
    showing: 'Mostrando',
    of: 'de',
    showing_of: 'Mostrando {0} de {1}',
    lessons: "Lecciones",
    prolog: "Prolog",
    student_account: "Cuenta de Estudiante",
    successful_executions: "Ejecuciones exitosas",
assignments_completed: "Tareas completadas",

current_activity_streak: "Racha de actividad actual",
review: "Revisar",
lines: "líneas",
code_editor: "Editor de Código",
practice_makes_perfect: "La Práctica Hace al Maestro",
practice_makes_perfect_desc: "Intenta resolver 3 nuevos problemas de Prolog esta semana para mejorar tus habilidades",
complete_assignments_early: "Completa las Tareas Temprano",
complete_assignments_early_desc: "Envía tu trabajo 2 días antes de la fecha límite para puntos extra",
join_study_group: "Únete a un Grupo de Estudio",
join_study_group_desc: "Colabora con compañeros en proyectos complejos de Prolog",
start_now: "Empezar Ahora",
view_assignments: "Ver Tareas",
join_now: "Únete Ahora",
success_rate_trend: "Tendencia de Tasa de Éxito",
submit_assignments_projects: "Envía tus tareas y proyectos",
templates: "Plantillas",
submit_code: "Enviar Código",
submissions_found: "envíos encontrados",
check_back_later: "Vuelve más tarde para nuevas tareas",
all_status: "Todo Estado",
all_difficulty: "Toda Dificultad",
browse_courses: "Explorar Cursos",
view_course: "Ver Curso",
continue: "Continuar",
track_achievements: "Sigue tus logros y crecimiento",
uploaded: "Subido",
expert_system: "Sistema Experto",
general_knowledge: "Conocimiento General",
general_assignment: "Tarea General",
date: "Fecha",
prolog_submission: "Envío Prolog",
no_submissions_yet: "Aún no hay envíos",
assignments_found: "tareas encontradas",
success: "Éxito",
    // НОВИ КЛЮЧОВЕ ОТ ПОСЛЕДНИЯ АНАЛИЗ:
    teacher_dashboard: 'Panel del Profesor',
    student_dashboard: 'Panel del Estudiante',
    teacher: 'Profesor',
    assignment_instructions_1: 'El proyecto debe contener:',
    assignment_instructions_2: 'Sección de título (comentarios) - asignatura, tema, nombre del estudiante, clase, fecha',
    assignment_instructions_3: 'Base de conocimientos (hechos) - mínimo 20 hechos relacionados con el tema',
    assignment_instructions_4: 'Reglas lógicas - mínimo 5 reglas que derivan nueva información',
    assignment_instructions_5: 'Menú de usuario - predicado principal start/0, menú con al menos 5 opciones',
    assignment_instructions_6: 'Consultas funcionales - el sistema debe responder correctamente',
    delete_assignment_error: '¡Error eliminando tarea!',
    untitled: 'Sin título',
    no_code: 'Sin código',
    uncategorized: 'Sin categorizar',
    completed_assignments: 'Tareas Completadas',
    in_progress_assignments: 'Tareas en Progreso',
    untitled_assignment: "Tarea sin título",
  learn_and_practice: "Aprender y practicar",
  unknown_action: "Acción desconocida",
  requested_to_join_community: "Solicitado unirse a la comunidad",
  not_specified: "No especificado",
  submission: "Envío",
  mark_all_as_read_confirm: "¿Marcar todos los mensajes como leídos?",
  symbolic_ai_expert_system: "IA Simbólica / Sistema Experto",
  notifications: "Notificaciones",
  delete_notification: "Eliminar notificación",
  
  // Communities
  unnamed_community: "Comunidad sin nombre",
  no_description: "Sin descripción",
  untitled_challenge: "Desafío sin título",
  challenge_solution: "Solución de desafío",
  challenge: "Desafío",
  joined_the_challenge: "Se unió al desafío",
  submitted_challenge_solution: "Solución de desafío enviada",
  
  // Messages
  delete_message_error: "Error al eliminar el mensaje",
  delete_all_messages_error: "Error al eliminar todos los mensajes",
  delete_read_messages_confirm: "¿Eliminar mensajes leídos?",
  delete_unread_messages_confirm: "¿Eliminar mensajes no leídos?",
  unread_messages: "mensajes no leídos",
  delete_messages_error: "Error al eliminar mensajes",
  mark_messages_error: "Error al marcar mensajes",
  no_messages_from_user: "No hay mensajes de este usuario",
  this_user: "este usuario",
  delete_messages_from_user_confirm: "Eliminar todos los mensajes de",
  messages_from: "mensajes de",
  deleted: "eliminados",
  challenge_created_notification: "📢 ¡Nuevo desafío \"{title}\" ha sido creado!",
  challenge_accepted_notification: "✅ ¡Desafío \"{title}\" ha sido aceptado!",
  challenge_responded_notification: "💬 El profesor respondió al desafío \"{title}\"",
  challenge_completed_notification: "🎉 ¡Desafío \"{title}\" ha sido completado!",
  challenge_created: "✅ Desafío creado para",
  challenge_deleted: "✅ ¡Desafío eliminado!",
  
  // Статуси
  responded: "respondido",
  rejected: "rechazado",
  submitted: "enviado",
  evaluated: "evaluado",
  waiting: "Esperando",
  action_needed: "Acción necesaria",
  done: "Hecho",
  more: "más",
  
  // Грешки
  error_loading_challenges: "❌ Error al cargar desafíos! Puede faltar un índice de Firebase.",
  error_accepting_challenge: "❌ ¡Error al aceptar desafío!",
  error_rejecting_challenge: "❌ ¡Error al rechazar desafío!",
  error_creating_challenge: "❌ ¡Error al crear desafío!",
  error_sending_response: "❌ ¡Error al enviar respuesta!",
  error_deleting_challenge: "❌ ¡Error al eliminar desafío!",
  error_grading_submission: "❌ ¡Error al calificar envío!",
  solved_challenge:"Desafío resuelto",
  new_lesson: "Nueva Lección",
new_lesson_in: "Nueva lección en",
code_uploaded: "Código Subido",
code_submitted: "Código Enviado",
challenge_solved: "Desafío Resuelto",
lesson_completed: "Lección Completada",
completed_lesson: "Lección Completada",
lessons_to_read: "Lecciones por Leer",
no_lessons_description: "No hay lecciones disponibles.",
browse_communities: "Explorar Comunidades",
  direct_message: "direct_message",
  pending_request: "pending_request",
  
  // Статистики и графики
  total_points: "Puntos Totales",
  last_4_weeks: "Últimas 4 Semanas",
  grades_trend: "Tendencia de Calificaciones",
  active_students: "Estudiantes Activos",
  student_activity_chart: "Gráfico de Actividad Estudiantil",
  activities: "Actividades",
  
  // Префикс за потребители
  user_prefix: "Usuario",
  
  // Основна грешка
  error: "Error",
objectives: "Objetivos",
read_lesson: "Leer Lección",
no_notifications_description: "No hay notificaciones.",
learning_objectives: "Objetivos de Aprendizaje",
prerequisites: "Requisitos Previos",
lesson_content: "Contenido de la Lección",
tags: "Etiquetas",
mark_as_completed: "Marcar como Completado",
  // Успешни съобщения
  submission_graded: "✅ ¡Envío calificado! ¡Desafío completado!",
  response_sent: "✅ ¡Respuesta enviada con éxito!",
  
  // Нотификации
  your_submission_received: "Tu envío para",
  received: "recibió",
  
  // Форми за предизвикателства
  challenge_will_be_created_for: "El desafío será creado para",
  max_points: "Puntos máximos",
  students_accepted: "estudiantes aceptaron",
  students_who_accepted: "Estudiantes que aceptaron este desafío",
  no_submissions_desc: "Ningún estudiante ha enviado soluciones para este desafío todavía.",
  view_submissions: "Ver envíos",
  grade_submission: "Calificar envío",
  update_grade: "Actualizar calificación",
  solution_code: "Código de solución",
  enter_score: "Ingresar puntuación",
  provide_feedback: "Proporcione comentarios al estudiante...",
  
  // Общности
  your_communities: "Tus comunidades",
  no_community_selected_title: "Ninguna comunidad seleccionada",
  no_community_selected_desc: "Por favor, seleccione una comunidad del menú desplegable para ver y gestionar desafíos.",
  
  // Създаване
  create_first_challenge_for: "Crea tu primer desafío para",
  no_date: "Sin fecha",
  deleting: "Eliminando...",
  
  // Оценяване
  needs_grading: "⚠️ ¡Necesita calificación!",
  
  // Валидация
  must_be_logged_in: "❌ ¡Debe iniciar sesión!",
  only_creator_can_delete: "❌ ¡Solo el creador puede eliminar este desafío!",
  confirm_delete_challenge: "¿Está seguro de que desea eliminar este desafío?",
  
  // Допълнителни
  challenge_completed: "¡Desafío completado!",
  student_accepted: "Estudiante",
  
  // Assignments and files
  unknown_assignment: "Tarea desconocida",
  unknown_file: "Archivo desconocido",
  introduction_to_prolog: "Introducción a Prolog",
  excellent_work_prolog: "¡Excelente trabajo! Tu comprensión de los conceptos básicos de Prolog es sólida.",
  expert_systems_design: "Diseño de Sistemas Expertos",
  good_work_detailed_rules: "Buen trabajo, pero podrías usar reglas más detalladas.",
  symbol_ai_expert_system: "IA Simbólica / Sistema Experto",
  submitted_prolog_code: "Código Prolog enviado",
  submitted_assignment: "Tarea enviada",
  accepted: "aceptados",
  
  // Notifications
  delete_notification_error: "Error al eliminar la notificación",
  delete_all_notifications_error: "Error al eliminar todas las notificaciones",
  notification: "Notificación",
  work_on_challenges: "Trabajar en Desafíos",
  
  // Grades
  detailed_view: "Vista Detallada",
  view_grade_details: "Ver Detalles de la Calificación",
  overdue_assignments: "Tareas Vencidas",
  overdue: "Vencido",
  sort_by_due_date: "Ordenar por Fecha Límite",
  sort_by_completion: "Ordenar por Finalización",
  sort_by_submissions: "Ordenar por Entregas",
  
  // Common buttons and actions
  delete_all: "Eliminar Todo",
  delete_all_messages_confirm: "¿Eliminar todos los mensajes?",
  delete_all_notifications_confirm: "¿Eliminar todas las notificaciones?",
  new_messages_will_appear_here: "Los nuevos mensajes aparecerán aquí",
  new_notifications_will_appear_here: "Las nuevas notificaciones aparecerán aquí",
  today: "Hoy",
  grade_received: "Calificación Recibida",
  system: "Sistema",
  no_notifications: "No hay notificaciones",
    
 
  }
};

interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ 
  children, 
  defaultLanguage = 'en' 
}) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLang = localStorage.getItem('language') as Language;
    return savedLang || defaultLanguage;
  });

  const languageOptions: LanguageOption[] = [
    { code: 'en', name: 'English', flag: '🇺🇸', label: 'EN' },
    { code: 'bg', name: 'Български', flag: '🇧🇬', label: 'BG' },
    { code: 'es', name: 'Español', flag: '🇪🇸', label: 'ES' },
  ];

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: keyof TranslationKeys): string => {
    return translations[language][key] || key;
  };

  const currentLanguage = languageOptions.find(lang => lang.code === language) || languageOptions[0];

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      languageOptions, 
      currentLanguage,
      t 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};