from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileRequired, FileAllowed
from wtforms import (
    StringField, PasswordField, EmailField, SubmitField, SelectField,
    DateField, FloatField, IntegerField, TextAreaField, BooleanField, DecimalField
)
from wtforms.validators import DataRequired, Length, Email, EqualTo, NumberRange, Optional


class RegisterForm(FlaskForm):
    first_name = StringField('First Name', validators=[DataRequired(), Length(max=64)])
    last_name = StringField('Last Name', validators=[DataRequired(), Length(max=64)])
    email = StringField('Email', validators=[DataRequired(), Email(), Length(max=255)])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6)])
    user_type = SelectField('Account Type', choices=[
        ('student', 'Student'),
        ('instructor', 'Instructor'),
        ('company', 'Company')
    ], validators=[DataRequired()])
        # Student fields
    university = StringField('University', validators=[Optional(), Length(max=128)])
    major = StringField('Major', validators=[Optional(), Length(max=64)])
    gpa = FloatField('GPA', validators=[Optional(), NumberRange(min=0, max=4)])
    expected_graduation_date = DateField('Expected Graduation Date', validators=[Optional()], format='%Y-%m-%d')
    bio_student = TextAreaField('Short Bio (optional)', validators=[Optional(), Length(max=1000)])
    resume_file = FileField('Resume/CV (optional)', validators=[
        Optional(),
        FileAllowed(['pdf', 'doc', 'docx'], 'Only PDF, DOC, and DOCX files are allowed.')
    ])

    # Instructor fields
    department = StringField('Department', validators=[Optional(), Length(max=128)])
    specialization = StringField('Specialization', validators=[Optional(), Length(max=128)])
    experience = IntegerField('Years of Experience', validators=[Optional(), NumberRange(min=0)])
    bio_instructor = TextAreaField('Short Bio (optional)', validators=[Optional(), Length(max=1000)])
    qualifications = TextAreaField('Qualifications (optional)', validators=[Optional()])

    # Company fields
    company_name = StringField('Company Name', validators=[Optional(), Length(max=128)])
    industry = StringField('Industry', validators=[Optional(), Length(max=128)])
    location = StringField('Location', validators=[Optional(), Length(max=128)])
    company_size = IntegerField('Company Size', validators=[Optional(), NumberRange(min=1)])
    founded_date = DateField('Founded Date', validators=[Optional()], format='%Y-%m-%d')
    bio_company = TextAreaField('Short Bio (optional)', validators=[Optional(), Length(max=1000)])
    website = StringField('Website', validators=[Optional(), Length(max=255)])

    submit = SubmitField('Create Account')



class LoginForm(FlaskForm):
    email = EmailField('Email', validators=[DataRequired(), Email(), Length(max=255)])
    password = PasswordField('Password', validators=[DataRequired()])
    submit = SubmitField('Login')


# Profile Form
class ProfileForm(FlaskForm):
    first_name = StringField('First Name', validators=[DataRequired(), Length(max=64)])
    last_name = StringField('Last Name', validators=[DataRequired(), Length(max=64)])
    email = StringField('Email', validators=[DataRequired(), Email(), Length(max=255)])
    profile_picture = StringField('Profile Picture', validators=[Optional(), Length(max=255)])
    bio = TextAreaField('Bio', validators=[Optional(), Length(max=1000)])


class PasswordChangeForm(FlaskForm):
    current_password = PasswordField('Current Password', validators=[DataRequired()])
    new_password = PasswordField('New Password', validators=[DataRequired(), Length(min=6)])
    confirm_password = PasswordField('Confirm Password', validators=[DataRequired(), EqualTo('new_password')])


class CourseForm(FlaskForm):
    title = StringField('Course Title', validators=[DataRequired(), Length(max=100)])
    description = TextAreaField('Course Description', validators=[Optional()])
    start_date = DateField('Start Date', validators=[DataRequired()])
    end_date = DateField('End Date', validators=[DataRequired()])
    duration = StringField('Duration (e.g., 4 weeks, 20 hours)', validators=[Optional(), Length(max=50)])
    type_id = SelectField('Course Type', choices=[], validators=[Optional()], coerce=int)
    required_tier = SelectField('Required Subscription Tier', choices=[
        ('freemium', 'Freemium'),
        ('basic', 'Basic'),
        ('standard', 'Standard'),
        ('premium', 'Premium'),
        ('premium_annual', 'Premium Annual')
    ], validators=[Optional()], default='freemium')
    max_students = IntegerField('Maximum Students', validators=[Optional(), NumberRange(min=1)])
    price = DecimalField('Price ($)', validators=[Optional(), NumberRange(min=0)], places=2, default=0.00)
    submit = SubmitField('Create Course')


class JobForm(FlaskForm):
    title = StringField('Job Title', validators=[DataRequired(), Length(max=100)])
    description = TextAreaField('Job Description', validators=[Optional()])
    requirements = TextAreaField('Requirements', validators=[Optional()])
    min_salary = DecimalField('Minimum Salary', validators=[Optional(), NumberRange(min=0)], places=2)
    max_salary = DecimalField('Maximum Salary', validators=[Optional(), NumberRange(min=0)], places=2)
    posting_date = DateField('Posting Date', validators=[DataRequired()])
    deadline_date = DateField('Application Deadline', validators=[Optional()])
    job_type = SelectField('Job Type', choices=[
        ('Full-time', 'Full-time'),
        ('Part-time', 'Part-time'),
        ('Contract', 'Contract'),
        ('Internship', 'Internship'),
        ('Remote', 'Remote')
    ], validators=[DataRequired()])
    location = StringField('Location', validators=[Optional(), Length(max=128)])
    experience_level = SelectField('Experience Level', choices=[
        ('Entry', 'Entry Level'),
        ('Mid', 'Mid Level'),
        ('Senior', 'Senior Level'),
        ('Executive', 'Executive Level')
    ], validators=[DataRequired()])
    is_urgent = BooleanField('Mark as Urgent')
    is_featured = BooleanField('Featured Job')
    submit = SubmitField('Save Job')


class AssessmentForm(FlaskForm):
    title = StringField('Assessment Title', validators=[DataRequired(), Length(max=100)])
    type = StringField('Assessment Type', validators=[Optional(), Length(max=50)])
    description = TextAreaField('Description', validators=[Optional()])
    due_date = DateField('Due Date', validators=[Optional()])
    max_score = FloatField('Maximum Score', validators=[Optional(), NumberRange(min=0)])
    weight = DecimalField('Weight (0-1)', validators=[Optional(), NumberRange(min=0, max=1)], places=2)
    instructions = TextAreaField('Instructions', validators=[Optional()])
    allow_late_submission = BooleanField('Allow Late Submissions')
    late_penalty = DecimalField('Late Penalty (%)', validators=[Optional(), NumberRange(min=0, max=100)], places=2)
    submit = SubmitField('Save Assessment')


class ContactForm(FlaskForm):
    name = StringField('Name', validators=[DataRequired(), Length(max=255)])
    email = EmailField('Email', validators=[DataRequired(), Email(), Length(max=255)])
    subject = StringField('Subject', validators=[DataRequired(), Length(max=255)])
    message = TextAreaField('Message', validators=[DataRequired()])
    priority = SelectField('Priority', choices=[
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('critical', 'Critical')
    ], default='normal')
    category = SelectField('Category', choices=[
        ('general', 'General'),
        ('technical', 'Technical'),
        ('billing', 'Billing'),
        ('course', 'Course'),
        ('account', 'Account'),
        ('feature', 'Feature Request'),
        ('bug', 'Bug Report'),
        ('other', 'Other')
    ], default='general')
    submit = SubmitField('Send Message')


class JobApplicationForm(FlaskForm):
    resume_file = FileField('Resume/CV', validators=[
        FileRequired('Please select a resume file.'),
        FileAllowed(['pdf', 'doc', 'docx'], 'Only PDF, DOC, and DOCX files are allowed.')
    ])
    cover_letter = TextAreaField('Cover Letter', validators=[
        DataRequired('Please provide a cover letter.'),
        Length(min=10, max=2000, message='Cover letter must be between 10 and 2000 characters.')
    ])
    submit = SubmitField('Submit Application')