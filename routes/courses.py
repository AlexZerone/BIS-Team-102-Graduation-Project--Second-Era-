from flask import render_template, request, redirect, url_for, flash, session, Blueprint
from models import get_record, get_records, execute_query
from permissions import login_required, role_required
from forms import CourseForm
from extensions import mysql  # Ensure you import your mysql instance

courses_bp = Blueprint('courses', __name__)

def get_student_id(user_id):
    student = get_record("SELECT StudentID FROM students WHERE UserID = %s", (user_id,))
    return student["StudentID"] if student else None

def get_instructor_id(user_id):
    instructor = get_record("SELECT InstructorID FROM instructors WHERE UserID = %s", (user_id,))
    return instructor["InstructorID"] if instructor else None

@courses_bp.route('/courses')
@login_required
def courses():
    user_id = session.get('user_id')
    user_type = session.get('user_type')

    if user_type == 'student':
        student_id = get_student_id(user_id)
        registered_courses = get_records('''
            SELECT c.*, cr.Status as RegistrationStatus 
            FROM courses c
            JOIN course_registrations cr ON c.CourseID = cr.CourseID
            WHERE cr.StudentID = %s
        ''', (student_id,))
    elif user_type == 'instructor':
        instructor_id = get_instructor_id(user_id)
        registered_courses = get_records('''
            SELECT c.*, COUNT(cr.StudentID) as EnrolledStudents
            FROM courses c
            JOIN instructor_courses ic ON c.CourseID = ic.CourseID
            LEFT JOIN course_registrations cr ON c.CourseID = cr.CourseID
            WHERE ic.InstructorID = %s
            GROUP BY c.CourseID
        ''', (instructor_id,))
    else:
        registered_courses = []

    return render_template('courses/courses.html', courses=registered_courses, user_type=user_type)

@courses_bp.route('/course/<int:course_id>')
@login_required
def course_detail(course_id):
    user_type = session.get('user_type')
    try:
        # Get basic course info plus instructor name(s)
        course = get_record('''
            SELECT c.*, GROUP_CONCAT(u.First, ' ', u.Last) AS InstructorNames
            FROM courses c
            JOIN instructor_courses ic ON c.CourseID = ic.CourseID
            JOIN instructors i ON ic.InstructorID = i.InstructorID
            JOIN users u ON i.UserID = u.UserID
            WHERE c.CourseID = %s
            GROUP BY c.CourseID
        ''', (course_id,))

        if not course:
            flash('Course not found', 'danger')
            return redirect(url_for('courses.courses'))

        # Get assessments for this course
        assessments = get_records('''
            SELECT * FROM assessments 
            WHERE CourseID = %s 
            ORDER BY DueDate ASC
        ''', (course_id,))

        # If instructor, get enrolled students
        enrolled_students = None
        if user_type == 'instructor':
            enrolled_students = get_records('''
                SELECT u.First, u.Last, cr.RegistrationDate, cr.Status
                FROM course_registrations cr
                JOIN students s ON cr.StudentID = s.StudentID
                JOIN users u ON s.UserID = u.UserID
                WHERE cr.CourseID = %s
            ''', (course_id,))

        return render_template('courses/course_detail.html',
                               course=course,
                               assessments=assessments,
                               enrolled_students=enrolled_students)
    except Exception as e:
        flash(f'Error loading course details: {str(e)}', 'danger')
        return redirect(url_for('courses.courses'))

@courses_bp.route('/course/enrolled_courses')
@login_required
@role_required(['student'])
def enrolled_courses():
    user_id = session.get('user_id')
    student_id = get_student_id(user_id)
    registered_courses = get_records('''
        SELECT c.*, cr.Status as RegistrationStatus 
        FROM courses c
        JOIN course_registrations cr ON c.CourseID = cr.CourseID
        WHERE cr.StudentID = %s
    ''', (student_id,))
    return render_template('courses/courses.html', courses=registered_courses, user_type='student')

@courses_bp.route('/course/create', methods=['GET', 'POST'])
@login_required
@role_required(['instructor'])
def create_course():
    form = CourseForm()
    
    # Get course types for the dropdown
    course_types = get_records('SELECT TypeID, TypeLabel FROM course_types ORDER BY TypeLabel')
    if course_types:
        form.type_id.choices = [(0, 'Select Course Type')] + [(ct['TypeID'], ct['TypeLabel']) for ct in course_types]
    else:
        form.type_id.choices = [(0, 'No course types available')]
    
    if form.validate_on_submit():
        try:
            # Get instructor ID
            instructor_id = get_instructor_id(session['user_id'])
            if not instructor_id:
                flash("Instructor profile not found. Please contact support.", "danger")
                return redirect(url_for('courses.courses'))
            
            # Prepare form data
            title = form.title.data
            description = form.description.data
            start_date = form.start_date.data
            end_date = form.end_date.data
            duration = form.duration.data
            type_id = form.type_id.data if form.type_id.data and form.type_id.data > 0 else None
            required_tier = form.required_tier.data
            max_students = form.max_students.data
            price = float(form.price.data) if form.price.data else 0.00
            
            # Validate dates
            if end_date <= start_date:
                flash("End date must be after start date.", "danger")
                return render_template('courses/create_course.html', form=form)
            
            # Insert course
            execute_query('''
                INSERT INTO courses (Title, Description, StartDate, EndDate, Duration, TypeID, 
                                   RequiredTier, MaxStudents, Price, IsPublished, ApprovalStatus, CreatedAt, UpdatedAt)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 0, 'Pending', NOW(), NOW())
            ''', (title, description, start_date, end_date, duration, type_id,
                  required_tier, max_students, price))
            
            # Get the created course ID
            course = get_record('SELECT CourseID FROM courses WHERE Title = %s AND CreatedAt >= NOW() - INTERVAL 1 MINUTE ORDER BY CreatedAt DESC LIMIT 1', (title,))
            
            if course:
                course_id = course['CourseID']
                
                # Link instructor to course
                execute_query('''
                    INSERT INTO instructor_courses (InstructorID, CourseID, CreatedAt)
                    VALUES (%s, %s, NOW())
                ''', (instructor_id, course_id))
                
                flash('Course created successfully and submitted for admin approval!', 'success')
                return redirect(url_for('courses.manage_courses'))
            else:
                flash('Course created but there was an issue linking it to your profile. Please contact support.', 'warning')
                return redirect(url_for('courses.courses'))
                
        except Exception as e:
            flash(f'Error creating course: {str(e)}', 'danger')
            return render_template('courses/create_course.html', form=form)
    
    return render_template('courses/create_course.html', form=form)

@courses_bp.route('/course/manage_courses')
@login_required
@role_required(['instructor'])
def manage_courses():
    user_id = session.get('user_id')
    instructor_id = get_instructor_id(user_id)
    courses = get_records('''
        SELECT c.*, COUNT(DISTINCT cr.StudentID) AS EnrolledCount,
               c.ApprovalStatus, c.IsPublished
        FROM courses c
        JOIN instructor_courses ic ON c.CourseID = ic.CourseID
        LEFT JOIN course_registrations cr ON c.CourseID = cr.CourseID
        WHERE ic.InstructorID = %s
        GROUP BY c.CourseID
        ORDER BY c.Title
    ''', (instructor_id,))
    return render_template('courses/manage_courses.html', courses=courses)


@courses_bp.route('/course/<int:course_id>/create_assessment', methods=['GET', 'POST'])
@login_required
@role_required(['instructor'])
def create_assessment(course_id):
    from forms import AssessmentForm
    
    # Verify instructor owns this course
    instructor_id = get_instructor_id(session['user_id'])
    course_check = get_record('''
        SELECT ic.* FROM instructor_courses ic 
        WHERE ic.InstructorID = %s AND ic.CourseID = %s
    ''', (instructor_id, course_id))
    
    if not course_check:
        flash('You do not have permission to create assessments for this course', 'danger')
        return redirect(url_for('courses.courses'))
    
    form = AssessmentForm()
    if form.validate_on_submit():
        try:
            execute_query('''
                INSERT INTO assessments (CourseID, Type, Description, DueDate, MaxScore, Weight, 
                                       Instructions, AllowLateSubmission, LatePenalty)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', (
                course_id, form.type.data, form.description.data, form.due_date.data,
                form.max_score.data, form.weight.data, form.instructions.data,
                form.allow_late_submission.data, form.late_penalty.data
            ))
            flash('Assessment created successfully!', 'success')
            return redirect(url_for('courses.course_detail', course_id=course_id))
        except Exception as e:
            flash(f'Error creating assessment: {str(e)}', 'danger')
    
    course = get_record('SELECT Title FROM courses WHERE CourseID = %s', (course_id,))
    return render_template('assessments/create_assessment.html', form=form, course=course, course_id=course_id)