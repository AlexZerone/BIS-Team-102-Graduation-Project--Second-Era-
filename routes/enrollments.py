from flask import render_template, request, redirect, url_for, flash, session, Blueprint
from models import get_record, get_records, execute_query
from permissions import login_required, role_required

enrollments_bp = Blueprint('enrollments', __name__)

# ✅ **Optimized Enrollment Route**
@enrollments_bp.route('/enrollment', methods=['GET', 'POST'])
@login_required
@role_required(['student'])
def enrollment():
    if 'user_id' not in session:
        flash('Please log in to access enrollment', 'warning')
        return redirect(url_for('auth.login'))

    user_id = session['user_id']
    user_type = session['user_type']
    
    if user_type != 'student':
        flash('Only students can access enrollment', 'warning')
        return redirect(url_for('dashboard.dashboard'))

    try:
        student = get_record('SELECT StudentID FROM students WHERE UserID = %s', (user_id,))
        if not student:
            flash("Student profile not found!", "danger")
            return redirect(url_for("dashboard.dashboard"))

        student_id = student['StudentID']

        if request.method == 'POST':
            course_id = request.form.get('course_id')

            # Check if already enrolled
            exists = get_record('SELECT * FROM course_registrations WHERE StudentID = %s AND CourseID = %s', (student_id, course_id))
            if exists:
                flash('You are already registered for this course', 'warning')
            else:
                execute_query('''
                    INSERT INTO course_registrations (StudentID, CourseID, RegistrationDate, Status)
                    VALUES (%s, %s, NOW(), 'Enrolled')
                ''', (student_id, course_id))
                flash('Successfully registered for the course', 'success')        # Fetch available courses that match student's subscription tier
        available_courses = get_records('''
            SELECT c.*, i.First AS InstructorFirst, i.Last AS InstructorLast,
                   c.RequiredTier, c.Price, c.MaxStudents,
                   (SELECT COUNT(*) FROM course_registrations WHERE CourseID = c.CourseID) as CurrentEnrollment
            FROM courses c
            JOIN instructor_courses ic ON c.CourseID = ic.CourseID
            JOIN instructors inst ON ic.InstructorID = inst.InstructorID
            JOIN users i ON inst.UserID = i.UserID
            WHERE c.CourseID NOT IN (
                SELECT CourseID FROM course_registrations WHERE StudentID = %s
            )
            AND c.StartDate >= CURDATE()
            AND c.IsPublished = 1
            AND c.ApprovalStatus = 'Approved'
            AND (c.MaxStudents IS NULL OR 
                 (SELECT COUNT(*) FROM course_registrations WHERE CourseID = c.CourseID) < c.MaxStudents)
        ''', (student_id,))

        # Get student's subscription tier for filtering
        student_profile = get_record('SELECT SubscriptionTier FROM students WHERE StudentID = %s', (student_id,))
        student_tier = student_profile['SubscriptionTier'] if student_profile else 'freemium'

        # Filter courses based on subscription tier
        tier_hierarchy = {
            'freemium': 0,
            'basic': 1,
            'standard': 2,
            'premium': 3,
            'premium_annual': 3
        }
        
        student_tier_level = tier_hierarchy.get(student_tier, 0)
        filtered_courses = []
        
        for course in available_courses:
            required_tier_level = tier_hierarchy.get(course['RequiredTier'], 0)
            if student_tier_level >= required_tier_level:
                course['can_enroll'] = True
            else:
                course['can_enroll'] = False
                course['upgrade_required'] = course['RequiredTier']
            filtered_courses.append(course)

        return render_template('courses/enrollment.html', available_courses=filtered_courses, 
                             user_type=user_type, student_tier=student_tier)

    except Exception as e:
        flash(f'Error processing enrollment: {str(e)}', 'danger')
        return render_template('courses/enrollment.html', available_courses=[], user_type=user_type)