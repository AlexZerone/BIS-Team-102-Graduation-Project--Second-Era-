from flask import render_template, request, redirect, url_for, flash, session, Blueprint, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from forms import LoginForm, RegisterForm
from models import get_record, execute_query, allowed_file, create_upload_folder
from permissions import login_required
from extensions import mysql
import os
import uuid
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def save_student_resume(file, student_id):
    """Save uploaded student resume file and return file path"""
    if file and allowed_file(file.filename, 'document'):
        try:
            # Check file size
            file.seek(0, os.SEEK_END)
            file_size = file.tell()
            file.seek(0)
            
            if file_size > MAX_FILE_SIZE:
                return None, "File too large. Please upload a file smaller than 10MB."
            
            # Generate unique filename
            file_extension = file.filename.rsplit('.', 1)[1].lower()
            safe_filename = secure_filename(file.filename.rsplit('.', 1)[0])
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            unique_filename = f"student_resume_{student_id}_{timestamp}_{safe_filename}.{file_extension}"
            
            # Create upload directory
            upload_folder = create_upload_folder(os.path.join(current_app.static_folder, 'uploads', 'resumes'))
            file_path = os.path.join(upload_folder, unique_filename)
            
            # Save file
            file.save(file_path)
            
            # Verify file was saved successfully
            if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
                return f"/static/uploads/resumes/{unique_filename}", None
            else:
                return None, "File upload failed. Please try again."
                
        except Exception as e:
            current_app.logger.error(f"Error saving student resume: {str(e)}")
            return None, "File upload failed. Please try again."
    return None, "Invalid file type. Please upload PDF, DOC, or DOCX files only."

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    form = RegisterForm()
    if form.validate_on_submit():
        # Check if email already exists
        existing = get_record('SELECT * FROM users WHERE Email = %s', (form.email.data,))
        if existing:
            flash('Email already registered.', 'danger')
            return render_template('auth/register.html', form=form)
        
        # Determine approval status and user status based on user type
        if form.user_type.data == 'student':
            approval_status = 'Approved'
            user_status = 'Active'
        else:  # instructor or company
            approval_status = 'Pending'
            user_status = 'Inactive'
        
        # Insert user with proper approval status
        password_hash = generate_password_hash(form.password.data)
        execute_query('''
            INSERT INTO users (First, Last, Email, Password, UserType, ApprovalStatus, Status, CreatedAt, UpdatedAt)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        ''', (form.first_name.data, form.last_name.data, form.email.data, password_hash, form.user_type.data, approval_status, user_status))
        
        user = get_record('SELECT * FROM users WHERE Email = %s', (form.email.data,))
        user_id = user['UserID']        # Insert profile data based on user type
        if form.user_type.data == 'student':
            # Handle resume file upload for students
            resume_path = None
            if form.resume_file.data and form.resume_file.data.filename:
                file = form.resume_file.data
                if allowed_file(file.filename):
                    resume_path, error_msg = save_student_resume(file, user_id)
                    if error_msg:
                        flash(f'Resume upload failed: {error_msg}', 'warning')
                else:
                    flash('Invalid resume file type. Only PDF, DOC, and DOCX files are allowed.', 'warning')
            
            execute_query('''
                INSERT INTO students (UserID, University, Major, GPA, ExpectedGraduationDate, Bio, ResumeFile, CreatedAt, UpdatedAt)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            ''', (user_id, form.university.data, form.major.data, form.gpa.data, 
                  form.expected_graduation_date.data, form.bio_student.data, resume_path))
        elif form.user_type.data == 'instructor':
            execute_query('''
                INSERT INTO instructors (UserID, Department, Specialization, Experience, Bio, Qualifications, CreatedAt, UpdatedAt)
                VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
            ''', (user_id, form.department.data, form.specialization.data, form.experience.data,
                  form.bio_instructor.data, form.qualifications.data))
        elif form.user_type.data == 'company':
            execute_query('''
                INSERT INTO companies (UserID, Name, Industry, Location, CompanySize, FoundedDate, Bio, Website, CreatedAt, UpdatedAt)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            ''', (user_id, form.company_name.data, form.industry.data, form.location.data, 
                  form.company_size.data, form.founded_date.data, form.bio_company.data, form.website.data))
        
        if form.user_type.data == 'student':
            flash('Account created successfully! You can now log in.', 'success')
        else:
            flash('Account created successfully! Your account is pending approval.', 'info')
        return redirect(url_for('auth.login'))
    return render_template('auth/register.html', form=form)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        email = form.email.data
        password = form.password.data

        # Fetch user by email first (don't filter by status yet)
        user = get_record('SELECT * FROM users WHERE Email = %s', (email,))
        
        if user:
            # Check approval status first
            if user.get('ApprovalStatus') == 'Pending':
                flash('Your account is pending approval. Please wait for admin approval.', 'warning')
                return render_template('auth/login.html', form=form)
            
            # Check if user status is active
            if user.get('Status') != 'Active':
                flash('Your account is not active. Please contact administrator.', 'danger')
                return render_template('auth/login.html', form=form)
            
            stored_password = user['Password']
            
            # Check if password exists and is not empty
            if not stored_password:
                flash('Account password not set. Please contact administrator.', 'danger')
                return render_template('auth/login.html', form=form)
            
            # Check if password is hashed (starts with hash method indicators)
            password_valid = False
            
            try:
                # Try to check as hashed password first
                password_valid = check_password_hash(stored_password, password)
            except ValueError:
                # If hash check fails, check if it's a plain text password (legacy)
                if stored_password == password:
                    password_valid = True
                    # Update to hashed password for security
                    try:
                        hashed_password = generate_password_hash(password)
                        execute_query('UPDATE users SET Password = %s WHERE UserID = %s', 
                                    (hashed_password, user['UserID']))
                        flash('Password security updated.', 'info')
                    except Exception as e:
                        # Log error but don't prevent login
                        pass
            
            if password_valid:
                session['user_id'] = user['UserID']
                session['user_type'] = user['UserType']
                session['user_name'] = user['First'] + " " + user['Last']

                try:
                    # Try to update LastLogin if column exists, otherwise just update UpdatedAt
                    execute_query('UPDATE users SET UpdatedAt = NOW() WHERE UserID = %s', (user['UserID'],))
                except Exception as e:
                    # Log error but don't prevent login
                    pass

                flash('Login successful!', 'success')
                if user['UserType'].lower() == 'admin':
                    return redirect(url_for('admin.dashboard'))
                else:
                    return redirect(url_for('dashboard.dashboard'))

        # Generic error message for user
        if not user:
            flash('Email not found. Please check your email or register.', 'danger')
        elif user.get('ApprovalStatus') == 'Pending':
            flash('Your account is pending approval. Please wait for admin approval.', 'warning')
        elif user.get('Status') != 'Active':
            flash('Your account is not active. Please contact administrator.', 'danger')
        else:
            flash('Invalid password. Please try again.', 'danger')

    return render_template('auth/login.html', form=form)



@auth_bp.route('/logout')
@login_required
def logout():
    session.clear()
    flash('You have been logged out', 'info')
    return redirect(url_for('auth.login'))
