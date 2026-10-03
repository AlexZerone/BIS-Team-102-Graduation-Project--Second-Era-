from flask import render_template, request, redirect, url_for, flash, session, Blueprint, jsonify, current_app
from models import get_record, get_records, execute_query
from permissions import login_required, role_required
from extensions import mysql
from forms import JobApplicationForm
import sys
import traceback
import json
import os
import uuid
from werkzeug.utils import secure_filename
from datetime import datetime


jobs_bp = Blueprint('jobs', __name__)

# File upload configuration
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_upload_folder(folder_path):
    """Create upload folder if it doesn't exist"""
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
    return folder_path

def save_resume_file(file, student_id, job_id):
    """Save uploaded resume file and return file path"""
    if file and allowed_file(file.filename):
        try:
            # Generate unique filename
            file_extension = file.filename.rsplit('.', 1)[1].lower()
            safe_filename = secure_filename(file.filename.rsplit('.', 1)[0])
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            unique_filename = f"resume_{student_id}_{job_id}_{timestamp}_{safe_filename}.{file_extension}"
            
            # Create upload directory
            upload_folder = create_upload_folder(os.path.join(current_app.static_folder, 'uploads', 'resumes'))
            file_path = os.path.join(upload_folder, unique_filename)
            
            # Save file
            file.save(file_path)
            
            # Verify file was saved successfully
            if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
                # Return relative path for database storage
                return f"/static/uploads/resumes/{unique_filename}"
            else:
                current_app.logger.error(f"File saved but verification failed: {file_path}")
                return None
                
        except Exception as e:
            current_app.logger.error(f"Error saving resume file: {str(e)}")
            return None
    return None

def check_job_prerequisites(job_id, student_id):
    """
    Check if a student meets the prerequisites for a job application
    Returns dict with eligibility status and details
    """
    try:        # Get job details and requirements
        job = get_record('''
            SELECT j.JobID, j.Title, j.Requirements, j.RequiredCourses, 
                   j.StructuredRequirements, j.ExperienceLevel, j.Location,
                   c.Industry, c.Name as CompanyName
            FROM jobs j
            JOIN companies c ON j.CompanyID = c.CompanyID
            WHERE j.JobID = %s
        ''', (job_id,))
        
        if not job:
            return {'eligible': False, 'reason': 'Job not found'}
        
        # Get student profile and achievements
        student_profile = get_record('''
            SELECT s.*, u.Email, u.First, u.Last, s.SubscriptionTier
            FROM students s
            JOIN users u ON s.UserID = u.UserID
            WHERE s.StudentID = %s
        ''', (student_id,))
        
        if not student_profile:
            return {'eligible': False, 'reason': 'Student profile not found'}        # Get student's completed courses and certifications
        completed_courses = get_records('''
            SELECT c.Title, c.Description, cr.RegistrationDate,
                   c.RequiredTier as CourseLevel
            FROM course_registrations cr
            JOIN courses c ON cr.CourseID = c.CourseID
            WHERE cr.StudentID = %s AND cr.Status = 'Enrolled'
        ''', (student_id,))
        
        # Handle case where queries return None
        if completed_courses is None:
            completed_courses = []
        
        # Get student's certificates
        certificates = get_records('''
            SELECT cert.CertificateNumber, cert.IssuedDate, c.Title as CourseName
            FROM certificates cert
            JOIN courses c ON cert.CourseID = c.CourseID
            WHERE cert.StudentID = %s AND cert.IsValid = 1
        ''', (student_id,))
        
        # Handle case where queries return None
        if certificates is None:
            certificates = []
        
        # Initialize prerequisite check results
        checks = {
            'subscription_level': {'required': False, 'met': True, 'details': ''},
            'course_completion': {'required': False, 'met': True, 'details': ''},
            'certifications': {'required': False, 'met': True, 'details': ''},
            'experience_level': {'required': False, 'met': True, 'details': ''},
            'skills_match': {'required': False, 'met': True, 'details': ''}
        }
          # Parse job requirements (if stored as JSON)
        requirements = {}
        if job.get('Requirements'):
            try:
                if job['Requirements'].startswith('{'):
                    requirements = json.loads(job['Requirements'])
                else:
                    # If requirements are stored as plain text, create basic structure
                    requirements = {'description': job['Requirements']}
            except:
                requirements = {'description': job['Requirements']}
        
        # Parse required courses from JSON column
        if job.get('RequiredCourses'):
            try:
                required_courses_json = json.loads(job['RequiredCourses']) if isinstance(job['RequiredCourses'], str) else job['RequiredCourses']
                requirements['required_courses'] = required_courses_json if isinstance(required_courses_json, list) else []
            except:
                pass
        
        # Check subscription level requirements
        premium_industries = ['finance', 'healthcare', 'government', 'defense']
        if job.get('Industry', '').lower() in premium_industries:
            checks['subscription_level']['required'] = True
            if student_profile['SubscriptionTier'] not in ['standard_monthly', 'premium_annual']:
                checks['subscription_level']['met'] = False
                checks['subscription_level']['details'] = f'Premium subscription required for {job.get("Industry")} industry jobs'
        
        # Check course completion requirements
        required_courses = requirements.get('required_courses', [])
        if required_courses:
            checks['course_completion']['required'] = True
            completed_course_titles = [course['Title'].lower() for course in completed_courses]
            missing_courses = []
            
            for req_course in required_courses:
                if req_course.lower() not in completed_course_titles:
                    missing_courses.append(req_course)
            
            if missing_courses:
                checks['course_completion']['met'] = False
                checks['course_completion']['details'] = f'Missing required courses: {", ".join(missing_courses)}'
          # Check certification requirements
        required_certs = requirements.get('required_certifications', [])
        if required_certs:
            checks['certifications']['required'] = True
            student_cert_names = [cert['CourseName'].lower() for cert in certificates]
            missing_certs = []
            
            for req_cert in required_certs:
                if req_cert.lower() not in student_cert_names:
                    missing_certs.append(req_cert)
            
            if missing_certs:
                checks['certifications']['met'] = False
                checks['certifications']['details'] = f'Missing required certifications: {", ".join(missing_certs)}'
          # Check experience level (based on completed courses and tier)
        experience_mapping = {
            'beginner': 0,
            'intermediate': 3,
            'advanced': 6,
            'expert': 10
        }
        
        required_experience = job.get('ExperienceLevel', '').lower()
        if required_experience and required_experience in experience_mapping:
            checks['experience_level']['required'] = True
            # Count courses as experience indicator
            student_course_count = len(completed_courses)
            
            required_level = experience_mapping[required_experience]
            if student_course_count < required_level:
                checks['experience_level']['met'] = False
                checks['experience_level']['details'] = f'Requires {required_experience} level. Complete more {required_experience}+ courses.'
        
        # Calculate overall eligibility
        all_met = all(check['met'] for check in checks.values() if check['required'])
        total_required = sum(1 for check in checks.values() if check['required'])
        total_met = sum(1 for check in checks.values() if check['required'] and check['met'])
        
        # Generate recommendations for improvement
        recommendations = []
        for check_name, check_data in checks.items():
            if check_data['required'] and not check_data['met']:
                recommendations.append(check_data['details'])
        
        return {
            'eligible': all_met,
            'checks': checks,
            'score': total_met / max(total_required, 1) * 100,
            'recommendations': recommendations,
            'student_progress': {
                'completed_courses': len(completed_courses),
                'certificates': len(certificates),
                'subscription': student_profile['SubscriptionTier']
            }
        }
        
    except Exception as e:
        return {
            'eligible': False, 
            'reason': f'Error checking prerequisites: {str(e)}',
            'checks': {},
            'recommendations': []
        }

# ✅ **Optimized Jobs Route**
@jobs_bp.route('/jobs')
@login_required
def jobs():
    if 'user_id' not in session:
        flash('Please log in to view jobs', 'warning')
        return redirect(url_for('auth.login'))

    user_id = session['user_id']
    user_type = session['user_type']

    try:
        if user_type == 'student':
            student = get_record('SELECT StudentID FROM students WHERE UserID = %s', (user_id,))
            if not student:
                flash("Student profile not found!", "danger")
                return redirect(url_for("dashboard.dashboard"))
            
            student_id = student['StudentID']
            
            # Optimized query: fetch jobs and application status in one go            
            jobs = get_records('''
                SELECT j.*, c.Name AS CompanyName, 
                                              COALESCE(ast.Name, 'Not Applied') AS ApplicationStatus,
                       ja.ApplicationDate, j.IsUrgent, j.IsFeatured
                FROM jobs j
                JOIN companies c ON j.CompanyID = c.CompanyID
                LEFT JOIN job_applications ja ON j.JobID = ja.JobID AND ja.StudentID = %s
                LEFT JOIN application_statuses ast ON ja.StatusID = ast.StatusID
                WHERE j.IsActive = 1 AND (j.DeadlineDate IS NULL OR j.DeadlineDate >= CURDATE())
                ORDER BY j.IsFeatured DESC, j.IsUrgent DESC, j.PostingDate DESC
            ''', (student_id,))

        elif user_type == 'company':
            # Fetch company's posted jobs
            jobs = get_records('''
                SELECT j.*, 
                       (SELECT COUNT(*) FROM job_applications WHERE JobID = j.JobID) AS ApplicationCount
                FROM jobs j
                JOIN companies c ON j.CompanyID = c.CompanyID
                WHERE c.UserID = %s
                ORDER BY j.PostingDate DESC
            ''', (user_id,))
        
        return render_template('jobs/jobs.html', jobs=jobs, user_type=user_type)

    except Exception as e:
        flash(f'Error loading jobs: {str(e)}', 'danger')
        return render_template('jobs/jobs.html', jobs=[], user_type=user_type)

@jobs_bp.route('/job/<int:job_id>')
@login_required
@role_required(['student', 'company'])
def job_detail(job_id):
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    
    try:
        job = get_record('''
            SELECT j.*, c.Name as CompanyName, c.Location, c.Industry
            FROM jobs j
            JOIN companies c ON j.CompanyID = c.CompanyID
            WHERE j.JobID = %s
        ''', (job_id,))
        
        if not job:
            flash('Job not found', 'danger')
            return redirect(url_for('jobs.jobs'))
        
        # Get application status if user is student
        application = None
        prerequisite_check = None
        if session['user_type'] == 'student':
            student = get_record('SELECT StudentID FROM students WHERE UserID = %s', 
                               (session['user_id'],))
            if student:
                application = get_record('''
                    SELECT ja.*, ast.Name as StatusName
                    FROM job_applications ja
                    LEFT JOIN application_statuses ast ON ja.StatusID = ast.StatusID
                    WHERE ja.JobID = %s AND ja.StudentID = %s
                ''', (job_id, student['StudentID']))
                
                # Check prerequisites if not already applied
                if not application:
                    prerequisite_check = check_job_prerequisites(job_id, student['StudentID'])
        
        return render_template('jobs/job_detail.html', job=job, application=application, 
                             prerequisite_check=prerequisite_check)
    
    except Exception as e:
        flash(f'Error loading job details: {str(e)}', 'danger')
        return redirect(url_for('jobs.jobs'))

@jobs_bp.route('/check-prerequisites/<int:job_id>')
@login_required
@role_required(['student'])
def check_prerequisites_api(job_id):
    """API endpoint to check job application prerequisites"""
    try:
        student = get_record('SELECT StudentID FROM students WHERE UserID = %s', 
                           (session['user_id'],))
        if not student:
            return jsonify({'error': 'Student profile not found'}), 404
        
        prerequisite_check = check_job_prerequisites(job_id, student['StudentID'])
        return jsonify(prerequisite_check)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@jobs_bp.route('/apply-job/<int:job_id>', methods=['POST'])
@login_required
@role_required(['student'])
def apply_job(job_id):
    if 'user_id' not in session or session['user_type'] != 'student':
        return redirect(url_for('auth.login'))
    
    try:
        # Get student info
        student = get_record('SELECT StudentID FROM students WHERE UserID = %s', 
                           (session['user_id'],))
        if not student:
            flash('Student profile not found', 'danger')
            return redirect(url_for('jobs.jobs'))
        
        student_id = student['StudentID']
        
        # Check if already applied
        existing = get_record('''
            SELECT * FROM job_applications 
            WHERE JobID = %s AND StudentID = %s
        ''', (job_id, student_id))
        
        if existing:
            flash('You have already applied for this job', 'warning')
            return redirect(url_for('jobs.job_detail', job_id=job_id))
        
        # Get form data
        cover_letter = request.form.get('cover_letter', '').strip()
        
        if not cover_letter:
            flash('Please provide a cover letter', 'danger')
            return redirect(url_for('jobs.job_detail', job_id=job_id))
          # Handle file upload
        resume_path = None
        if 'resume_file' in request.files:
            file = request.files['resume_file']
            
            if file.filename == '':
                flash('Please select a resume file', 'danger')
                return redirect(url_for('jobs.job_detail', job_id=job_id))
            
            if not allowed_file(file.filename):
                flash('Invalid file type. Please upload PDF, DOC, or DOCX files only.', 'danger')
                return redirect(url_for('jobs.job_detail', job_id=job_id))
            
            # Check file size efficiently
            file.seek(0, os.SEEK_END)
            file_size = file.tell()
            file.seek(0)  # Reset file position
            
            if file_size > MAX_FILE_SIZE:
                flash('File too large. Please upload a file smaller than 10MB.', 'danger')
                return redirect(url_for('jobs.job_detail', job_id=job_id))
            
            # Save the file
            try:
                resume_path = save_resume_file(file, student_id, job_id)
                if not resume_path:
                    flash('Error uploading resume. Please try again.', 'danger')
                    return redirect(url_for('jobs.job_detail', job_id=job_id))
            except Exception as e:
                current_app.logger.error(f"Error saving resume file: {str(e)}")
                flash('Error uploading resume. Please try again.', 'danger')
                return redirect(url_for('jobs.job_detail', job_id=job_id))
        else:
            flash('Please upload your resume', 'danger')
            return redirect(url_for('jobs.job_detail', job_id=job_id))
        
        # Check prerequisites (but allow application regardless)
        prerequisite_check = check_job_prerequisites(job_id, student_id)
        
        # Warn if not fully qualified but still allow application
        if not prerequisite_check.get('eligible', False):
            warning_msg = "Note: You may not meet all requirements for this position."
            if prerequisite_check.get('recommendations'):
                warning_msg += " Consider: " + "; ".join(prerequisite_check['recommendations'][:2])
            flash(warning_msg, 'warning')
        
        # Submit application
        execute_query('''
            INSERT INTO job_applications 
            (JobID, StudentID, ApplicationDate, StatusID, ResumePath, CoverLetter, PrerequisiteScore, Notes)
            VALUES (%s, %s, NOW(), 1, %s, %s, %s, %s)
        ''', (
            job_id, 
            student_id, 
            resume_path,
            cover_letter,
            prerequisite_check.get('score', 0),
            json.dumps(prerequisite_check) if prerequisite_check else None
        ))
        
        success_msg = 'Application submitted successfully!'
        if prerequisite_check.get('eligible', False):
            success_msg += ' You meet all the requirements!'        
        flash(success_msg, 'success')
        
        return redirect(url_for('jobs.job_detail', job_id=job_id))
    
    except Exception as e:
        current_app.logger.error(f"Error in apply_job: {str(e)}")
        flash(f'Error submitting application: {str(e)}', 'danger')
        return redirect(url_for('jobs.job_detail', job_id=job_id))

@jobs_bp.route('/manage-jobs')
@login_required
@role_required(['company'])
def manage_jobs():
    user_id = session['user_id']
    
    try:
        # Get company ID from the session's user
        company = get_record('SELECT CompanyID FROM companies WHERE UserID = %s', (user_id,))
        if not company:
            flash("Company profile not found!", "danger")
            return redirect(url_for("dashboard.dashboard"))
            
        company_id = company['CompanyID']
        
        # Fetch all jobs posted by this company with application counts
        jobs = get_records('''
            SELECT j.*, 
                (SELECT COUNT(*) FROM job_applications WHERE JobID = j.JobID) AS ApplicationCount
            FROM jobs j
            WHERE j.CompanyID = %s
            ORDER BY j.PostingDate DESC
        ''', (company_id,))
        
        return render_template('jobs/manage_jobs.html', jobs=jobs)
    
    except Exception as e:
        flash(f"Error managing jobs: {str(e)}", "danger")
        return render_template('jobs/manage_jobs.html', jobs=[])

@jobs_bp.route('/edit-job/<int:job_id>', methods=['GET', 'POST'])
@login_required
@role_required(['company'])
def edit_job(job_id):
    # Ensure company owns this job
    user_id = session.get('user_id')
    if not user_id:
        return redirect(url_for('auth.login'))

    company = get_record('SELECT CompanyID FROM companies WHERE UserID = %s', (user_id,))
    if not company:
        flash("Company profile not found!", "danger")
        return redirect(url_for("dashboard.dashboard"))
    company_id = company['CompanyID']

    job = get_record('''
        SELECT * FROM jobs
        WHERE JobID = %s AND CompanyID = %s
    ''', (job_id, company_id))
    if not job:
        flash('Job not found or unauthorized access', 'danger')
        return redirect(url_for('jobs.manage_jobs'))

    if request.method == 'POST':
        title = request.form.get('title')
        description = request.form.get('description')
        requirements = request.form.get('requirements', '')
        location = request.form.get('location', '')
        job_type = request.form.get('type', '')
        min_salary = request.form.get('min_salary', None)
        max_salary = request.form.get('max_salary', None)
        deadline = request.form.get('deadline')
        
        execute_query('''
            UPDATE jobs
            SET Title = %s, Description = %s, Requirements = %s,
                Location = %s, Type = %s, MinSalary = %s,
                MaxSalary = %s, DeadlineDate = %s
            WHERE JobID = %s AND CompanyID = %s
        ''', (title, description, requirements, location, job_type,
              min_salary, max_salary, deadline, job_id, company_id))
        flash('Job updated successfully', 'success')
        return redirect(url_for('jobs.manage_jobs'))

    return render_template('jobs/edit_job.html', job=job)

@jobs_bp.route('/create-job', methods=['GET', 'POST'])
@login_required
@role_required(['company'])
def create_job():
    """Route for companies to create a new job posting"""
    try:
        user_id = session['user_id']
        
        # Get company ID
        company = get_record('SELECT CompanyID FROM companies WHERE UserID = %s', (user_id,))
        if not company:
            flash("Company profile not found!", "danger")
            return redirect(url_for("dashboard.dashboard"))
            
        company_id = company['CompanyID']
        
        if request.method == 'POST':
            # Get form data
            title = request.form.get('title')
            description = request.form.get('description')
            requirements = request.form.get('requirements', '')
            location = request.form.get('location', '')
            job_type = request.form.get('type', '')
            min_salary = request.form.get('min_salary', None)
            max_salary = request.form.get('max_salary', None)
            deadline = request.form.get('deadline')
            
            # Validate required fields
            if not title or not description or not deadline:
                flash("Title, description, and deadline are required fields", "danger")
                return redirect(url_for('jobs.create_job'))

            # Create new job
            execute_query('''
                INSERT INTO jobs 
                (CompanyID, Title, Description, Requirements, Location, Type, 
                 MinSalary, MaxSalary, PostingDate, DeadlineDate, IsActive)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CURDATE(), %s, 1)
            ''', (company_id, title, description, requirements, location, job_type,
                  min_salary, max_salary, deadline))
                  
            flash("New job posted successfully!", "success")
            return redirect(url_for('jobs.manage_jobs'))
        
        # GET request: show the job creation form
        print("DEBUG: About to render create_job.html template", file=sys.stderr)
        return render_template('jobs/create_job.html')
    except Exception as e:
        print(f"ERROR in create_job: {str(e)}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        flash(f"Error creating job: {str(e)}", "danger")
        return redirect(url_for('jobs.manage_jobs'))

@jobs_bp.route('/review-applications/<int:job_id>')
@login_required
@role_required(['company'])
def review_applications(job_id):
    """Route for companies to review job applications"""
    user_id = session['user_id']
    
    try:
        # Get company ID and verify job ownership
        company = get_record('SELECT CompanyID FROM companies WHERE UserID = %s', (user_id,))
        if not company:
            flash("Company profile not found!", "danger")
            return redirect(url_for("dashboard.dashboard"))
            
        company_id = company['CompanyID']
        
        # Verify this job belongs to the company
        job = get_record('''
            SELECT * FROM jobs
            WHERE JobID = %s AND CompanyID = %s
        ''', (job_id, company_id))
        
        if not job:
            flash("Job not found or you don't have permission to review applications", "danger")
            return redirect(url_for("jobs.manage_jobs"))
        
        # Get all applications for this job with student details
        applications = get_records('''
            SELECT ja.*, s.StudentID, u.First, u.Last, u.Email, 
                   ast.Name as StatusName
            FROM job_applications ja
            JOIN students s ON ja.StudentID = s.StudentID
            JOIN users u ON s.UserID = u.UserID
            LEFT JOIN application_statuses ast ON ja.StatusID = ast.StatusID
            WHERE ja.JobID = %s
            ORDER BY ja.ApplicationDate DESC
        ''', (job_id,))
        
        # Get available status options
        statuses = get_records('SELECT * FROM application_statuses ORDER BY StatusID')
        
        return render_template('jobs/review_applications.html', 
                              applications=applications, 
                              job=job,
                              statuses=statuses)
    
    except Exception as e:
        flash(f"Error reviewing applications: {str(e)}", "danger")
        return redirect(url_for("jobs.manage_jobs"))

@jobs_bp.route('/update-application-status/<int:application_id>', methods=['POST'])
@login_required
@role_required(['company'])
def update_application_status(application_id):
    """Route to update the status of a job application"""
    user_id = session['user_id']
    
    try:
        # Get company ID
        company = get_record('SELECT CompanyID FROM companies WHERE UserID = %s', (user_id,))
        if not company:
            flash("Company profile not found!", "danger")
            return redirect(url_for("dashboard.dashboard"))
            
        company_id = company['CompanyID']
        
        # Get the application details
        application = get_record('''
            SELECT ja.*, j.CompanyID 
            FROM job_applications ja
            JOIN jobs j ON ja.JobID = j.JobID
            WHERE ja.ApplicationID = %s
        ''', (application_id,))
        
        if not application or application['CompanyID'] != company_id:
            flash("Application not found or you don't have permission to update it", "danger")
            return redirect(url_for("jobs.manage_jobs"))
        
        # Update the status
        new_status_id = request.form.get('status_id')
        feedback = request.form.get('feedback', '')
        
        execute_query('''
            UPDATE job_applications
            SET StatusID = %s, UpdatedAt = NOW()
            WHERE ApplicationID = %s
        ''', (new_status_id, application_id))
        
        flash("Application status updated successfully", "success")
        return redirect(url_for('jobs.review_applications', job_id=application['JobID']))
    
    except Exception as e:
        flash(f"Error updating application status: {str(e)}", "danger")
        return redirect(url_for("jobs.manage_jobs"))
