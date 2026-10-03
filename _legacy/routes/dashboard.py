from flask import render_template, request, redirect, url_for, flash, session, Blueprint
from models import get_record, get_records, execute_query
from permissions import login_required, role_required

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard')
@login_required
def dashboard():
    if 'user_id' not in session:
        flash('Please log in to access the dashboard', 'warning')
        return redirect(url_for('auth.login'))
    
    try:
        user_id = session['user_id']
        user_type = session['user_type']

        user = get_record('SELECT * FROM users WHERE UserID = %s', (user_id,))
        profile = None
        stats = {}

        if user_type == 'student':
            profile = get_record('SELECT * FROM students WHERE UserID = %s', (user_id,))
            if profile:
                student_id = profile['StudentID']
                # Get dashboard stats
                stats['enrolled_courses'] = get_record(
                    'SELECT COUNT(*) as count FROM course_registrations WHERE StudentID = %s', 
                    (student_id,))['count'] or 0
                stats['completed_courses'] = get_record(
                    'SELECT COUNT(*) as count FROM course_registrations WHERE StudentID = %s AND Status = "Completed"', 
                    (student_id,))['count'] or 0
                stats['job_applications'] = get_record(
                    'SELECT COUNT(*) as count FROM job_applications WHERE StudentID = %s', 
                    (student_id,))['count'] or 0
                stats['certificates'] = get_record(
                    'SELECT COUNT(*) as count FROM certificates WHERE StudentID = %s AND IsValid = 1', 
                    (student_id,))['count'] or 0
                
        elif user_type == 'instructor':
            profile = get_record('SELECT * FROM instructors WHERE UserID = %s', (user_id,))
            if profile:
                instructor_id = profile['InstructorID']
                stats['teaching_courses'] = get_record(
                    'SELECT COUNT(*) as count FROM instructor_courses WHERE InstructorID = %s', 
                    (instructor_id,))['count'] or 0
                stats['total_students'] = get_record('''
                    SELECT COUNT(DISTINCT cr.StudentID) as count
                    FROM instructor_courses ic
                    JOIN course_registrations cr ON ic.CourseID = cr.CourseID
                    WHERE ic.InstructorID = %s
                ''', (instructor_id,))['count'] or 0
                
        elif user_type == 'company':
            profile = get_record('SELECT * FROM companies WHERE UserID = %s', (user_id,))
            if profile:
                company_id = profile['CompanyID']
                stats['posted_jobs'] = get_record(
                    'SELECT COUNT(*) as count FROM jobs WHERE CompanyID = %s', 
                    (company_id,))['count'] or 0
                stats['total_applications'] = get_record('''
                    SELECT COUNT(*) as count FROM job_applications ja
                    JOIN jobs j ON ja.JobID = j.JobID
                    WHERE j.CompanyID = %s
                ''', (company_id,))['count'] or 0
        
        return render_template('profile/dashboard.html', user=user, profile=profile, 
                             user_type=user_type, stats=stats)
    
    except Exception as e:
        flash(f'Error loading dashboard: {str(e)}', 'danger')
        return redirect(url_for('home.home'))