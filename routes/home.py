# filepath: d:\college\Word\Graduation Project (BIS)\Code\BIS-Team-102-Graduation-Project\routes\home.py
from flask import render_template, request, redirect, url_for, flash, session, Blueprint
from datetime import datetime
from models import get_record, get_records, execute_query
from permissions import login_required, role_required
from extensions import mysql

home_bp = Blueprint('home', __name__)

@home_bp.route('/')
@home_bp.route('/home')
def home():
    if 'user_id' in session:
        return redirect(url_for('home.post_home'))
    return render_template('home.html')

@home_bp.route('/Post-home')
@login_required
def post_home():
    user_id = session['user_id']
    user_type = session['user_type']
    user = get_record('SELECT * FROM users WHERE UserID = %s', (user_id,))
    
    # Fetch role-specific data
    activities = []
    upcoming_items = []
    stats = {}

    if user_type == 'student':
        student = get_record('SELECT StudentID FROM students WHERE UserID = %s', (user_id,))
        if student:
            student_id = student['StudentID']
            # Number of enrolled courses
            course_count = get_record('SELECT COUNT(*) as count FROM course_registrations WHERE StudentID = %s', (student_id,))
            stats['enrolled_courses'] = course_count['count'] if course_count else 0
            
            # Get upcoming assignments
            raw_upcoming_items = get_records('''
                SELECT a.Type as Title, a.DueDate, c.Title as CourseTitle
                FROM assessments a
                JOIN courses c ON a.CourseID = c.CourseID
                JOIN course_registrations cr ON c.CourseID = cr.CourseID
                WHERE cr.StudentID = %s AND a.DueDate >= CURDATE()
                ORDER BY a.DueDate ASC
                LIMIT 5
            ''', (student_id,))
            
            # Process upcoming items to match template expectations
            upcoming_items = []
            for item in raw_upcoming_items or []:
                due_date = item['DueDate']
                # Safely calculate days_left
                try:
                    days_left = (due_date - datetime.now().date()).days if due_date else 0
                except (TypeError, AttributeError):
                    days_left = 0
                
                upcoming_items.append({
                    'title': item['Title'],
                    'subtitle': item['CourseTitle'],
                    'date': due_date.strftime('%Y-%m-%d') if due_date else 'No date',
                    'days_left': days_left
                })
            
            # Get recent activities (e.g., submissions)
            raw_activities = get_records('''
                SELECT sa.SubmissionDate, a.Type AS AssessTitle, c.Title AS CourseTitle, 
                       sa.Score, sa.Status
                FROM student_assessments sa
                JOIN assessments a ON sa.AssessmentID = a.AssessID
                JOIN courses c ON a.CourseID = c.CourseID
                WHERE sa.StudentID = %s AND sa.SubmissionDate IS NOT NULL
                ORDER BY sa.SubmissionDate DESC
                LIMIT 5
            ''', (student_id,))
            
            # Process activities to match template expectations
            activities = []
            if raw_activities:
                for activity in raw_activities:
                    description = f"Submitted '{activity['AssessTitle']}' for {activity['CourseTitle']}"
                    score_text = f" - Score: {activity['Score']}" if activity['Score'] is not None else f" - {activity['Status']}"
                    activities.append({
                        'type': 'assignment',
                        'description': description + score_text,
                        'timestamp': activity['SubmissionDate'].strftime('%Y-%m-%d') if activity['SubmissionDate'] else 'N/A'
                    })

            # Get recent course enrollments as activities
            recent_enrollments = get_records('''
                SELECT cr.RegistrationDate, c.Title as CourseTitle, cr.Status
                FROM course_registrations cr
                JOIN courses c ON cr.CourseID = c.CourseID
                WHERE cr.StudentID = %s
                ORDER BY cr.RegistrationDate DESC
                LIMIT 3
            ''', (student_id,))
            
            if recent_enrollments:
                for enrollment in recent_enrollments:
                    activities.append({
                        'type': 'enrollment',
                        'description': f"Enrolled in '{enrollment['CourseTitle']}' - Status: {enrollment['Status']}",
                        'timestamp': enrollment['RegistrationDate'].strftime('%Y-%m-%d') if enrollment['RegistrationDate'] else 'N/A'
                    })

    elif user_type == 'instructor':
        instructor = get_record('SELECT InstructorID FROM instructors WHERE UserID = %s', (user_id,))
        if instructor:
            instructor_id = instructor['InstructorID']
            # Number of assigned courses
            course_count = get_record('SELECT COUNT(*) as count FROM instructor_courses WHERE InstructorID = %s', (instructor_id,))
            stats['assigned_courses'] = course_count['count'] if course_count else 0
            
            # Get total students across all courses
            student_count = get_record('''
                SELECT COUNT(DISTINCT cr.StudentID) as count
                FROM instructor_courses ic
                JOIN course_registrations cr ON ic.CourseID = cr.CourseID
                WHERE ic.InstructorID = %s
            ''', (instructor_id,))
            stats['total_students'] = student_count['count'] if student_count else 0
            
            # Get upcoming assessments to grade
            raw_upcoming_items = get_records('''
                SELECT a.Type as Title, a.DueDate, c.Title as CourseTitle,
                       COUNT(sa.AssessmentID) as SubmissionCount
                FROM assessments a
                JOIN courses c ON a.CourseID = c.CourseID
                JOIN instructor_courses ic ON c.CourseID = ic.CourseID
                LEFT JOIN student_assessments sa ON a.AssessID = sa.AssessmentID 
                    AND sa.Status = 'Submitted'
                WHERE ic.InstructorID = %s AND a.DueDate >= CURDATE()
                GROUP BY a.AssessID
                ORDER BY a.DueDate ASC
                LIMIT 5
            ''', (instructor_id,))
            
            # Process upcoming items
            upcoming_items = []
            if raw_upcoming_items:
                for item in raw_upcoming_items:
                    due_date = item['DueDate']
                    try:
                        days_left = (due_date - datetime.now().date()).days if due_date else 0
                    except (TypeError, AttributeError):
                        days_left = 0
                    
                    upcoming_items.append({
                        'title': item['Title'],
                        'subtitle': f"{item['CourseTitle']} - {item['SubmissionCount']} submissions",
                        'date': due_date.strftime('%Y-%m-%d') if due_date else 'No date',
                        'days_left': days_left
                    })
            
            # Get recent activities (course updates, new enrollments)
            recent_enrollments = get_records('''
                SELECT cr.RegistrationDate, c.Title as CourseTitle, 
                       u.First, u.Last, cr.Status
                FROM course_registrations cr
                JOIN courses c ON cr.CourseID = c.CourseID
                JOIN instructor_courses ic ON c.CourseID = ic.CourseID
                JOIN students s ON cr.StudentID = s.StudentID
                JOIN users u ON s.UserID = u.UserID
                WHERE ic.InstructorID = %s
                ORDER BY cr.RegistrationDate DESC
                LIMIT 5
            ''', (instructor_id,))
            
            activities = []
            if recent_enrollments:
                for enrollment in recent_enrollments:
                    activities.append({
                        'type': 'enrollment',
                        'description': f"{enrollment['First']} {enrollment['Last']} enrolled in '{enrollment['CourseTitle']}'",
                        'timestamp': enrollment['RegistrationDate'].strftime('%Y-%m-%d') if enrollment['RegistrationDate'] else 'N/A'
                    })

    elif user_type == 'company':
        company = get_record('SELECT CompanyID FROM companies WHERE UserID = %s', (user_id,))
        if company:
            company_id = company['CompanyID']
            # Number of posted jobs
            job_count = get_record('SELECT COUNT(*) as count FROM jobs WHERE CompanyID = %s', (company_id,))
            stats['posted_jobs'] = job_count['count'] if job_count else 0
            
            # Total applications received
            app_count = get_record('''
                SELECT COUNT(*) as count FROM job_applications ja
                JOIN jobs j ON ja.JobID = j.JobID
                WHERE j.CompanyID = %s
            ''', (company_id,))
            stats['total_applications'] = app_count['count'] if app_count else 0
            
            # Get recent job applications
            recent_applications = get_records('''
                SELECT ja.ApplicationDate, j.Title as JobTitle, 
                       u.First, u.Last, ast.Name as StatusName
                FROM job_applications ja
                JOIN jobs j ON ja.JobID = j.JobID
                JOIN students s ON ja.StudentID = s.StudentID
                JOIN users u ON s.UserID = u.UserID
                LEFT JOIN application_statuses ast ON ja.StatusID = ast.StatusID
                WHERE j.CompanyID = %s
                ORDER BY ja.ApplicationDate DESC
                LIMIT 5
            ''', (company_id,))
            
            activities = []
            if recent_applications:
                for app in recent_applications:
                    activities.append({
                        'type': 'application',
                        'description': f"{app['First']} {app['Last']} applied for '{app['JobTitle']}' - {app['StatusName']}",
                        'timestamp': app['ApplicationDate'].strftime('%Y-%m-%d') if app['ApplicationDate'] else 'N/A'
                    })
            
            # Get upcoming job deadlines
            upcoming_jobs = get_records('''
                SELECT j.Title, j.DeadlineDate
                FROM jobs j
                WHERE j.CompanyID = %s AND j.DeadlineDate >= CURDATE()
                ORDER BY j.DeadlineDate ASC
                LIMIT 5
            ''', (company_id,))
            
            upcoming_items = []
            if upcoming_jobs:
                for job in upcoming_jobs:
                    deadline = job['DeadlineDate']
                    try:
                        days_left = (deadline - datetime.now().date()).days if deadline else 0
                    except (TypeError, AttributeError):
                        days_left = 0
                    
                    upcoming_items.append({
                        'title': job['Title'],
                        'subtitle': 'Application Deadline',
                        'date': deadline.strftime('%Y-%m-%d') if deadline else 'No date',
                        'days_left': days_left
                    })

    # Featured/Recommended content based on user type
    featured_content = []
    if user_type == 'student':
        # Recommend jobs based on latest postings
        raw_featured = get_records('''
            SELECT j.JobID, j.Title, c.Name AS CompanyName, j.PostingDate, j.Type
            FROM jobs j
            JOIN companies c ON j.CompanyID = c.CompanyID
            WHERE j.IsActive = 1 AND (j.DeadlineDate IS NULL OR j.DeadlineDate >= CURDATE())
            ORDER BY j.PostingDate DESC
            LIMIT 3
        ''')
        
        if raw_featured:
            for job in raw_featured:
                featured_content.append({
                    'id': job['JobID'],
                    'title': job['Title'],
                    'subtitle': job['CompanyName'],
                    'type': 'job',
                    'meta': job['Type'],
                    'date': job['PostingDate'].strftime('%Y-%m-%d') if job['PostingDate'] else ''
                })
    
    # Add current date for display on the home page
    current_date = datetime.now()
        
    return render_template('Post-Login Home.html',
                          user=user,
                          user_type=user_type,
                          stats=stats,
                          activities=activities,
                          upcoming_items=upcoming_items,
                          featured_content=featured_content,
                          current_date=current_date)
