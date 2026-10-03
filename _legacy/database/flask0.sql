-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 12, 2025 at 12:14 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `flask0`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_activity_log`
--

CREATE TABLE `admin_activity_log` (
  `LogID` int(11) NOT NULL,
  `AdminID` int(11) NOT NULL,
  `Action` varchar(100) NOT NULL,
  `TargetType` enum('user','course','job','application','payment') NOT NULL,
  `TargetID` int(11) NOT NULL,
  `OldValue` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`OldValue`)),
  `NewValue` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`NewValue`)),
  `Description` text DEFAULT NULL,
  `IPAddress` varchar(45) DEFAULT NULL,
  `UserAgent` text DEFAULT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin_activity_log`
--

INSERT INTO `admin_activity_log` (`LogID`, `AdminID`, `Action`, `TargetType`, `TargetID`, `OldValue`, `NewValue`, `Description`, `IPAddress`, `UserAgent`, `CreatedAt`) VALUES
(1, 1, 'instructor_approve', '', 3, NULL, '{\"reason\": \"\", \"user_id\": 11}', NULL, '127.0.0.1', NULL, '2025-06-11 21:09:12');

-- --------------------------------------------------------

--
-- Table structure for table `application_feedback`
--

CREATE TABLE `application_feedback` (
  `FeedbackID` int(11) NOT NULL,
  `ApplicationID` int(11) NOT NULL,
  `FeedbackType` enum('prerequisite_suggestion','skill_improvement','course_recommendation') NOT NULL,
  `Title` varchar(255) NOT NULL,
  `Description` text NOT NULL,
  `Priority` enum('low','medium','high') DEFAULT 'medium',
  `IsCompleted` tinyint(1) DEFAULT 0,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `CompletedAt` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `application_statuses`
--

CREATE TABLE `application_statuses` (
  `StatusID` int(11) NOT NULL,
  `Name` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `application_statuses`
--

INSERT INTO `application_statuses` (`StatusID`, `Name`) VALUES
(4, 'Accepted'),
(3, 'Interview'),
(1, 'Pending'),
(5, 'Rejected'),
(2, 'Under Review'),
(6, 'Withdrawn');

-- --------------------------------------------------------

--
-- Table structure for table `assessments`
--

CREATE TABLE `assessments` (
  `AssessID` int(11) NOT NULL,
  `CourseID` int(11) NOT NULL,
  `Type` varchar(50) DEFAULT NULL,
  `Description` text DEFAULT NULL,
  `DueDate` date DEFAULT NULL,
  `MaxScore` float DEFAULT NULL,
  `Weight` decimal(5,2) DEFAULT NULL CHECK (`Weight` between 0 and 1),
  `Instructions` text DEFAULT NULL,
  `AllowLateSubmission` tinyint(1) DEFAULT 0,
  `LatePenalty` decimal(5,2) DEFAULT 0.00,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `UpdatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `assessments`
--

INSERT INTO `assessments` (`AssessID`, `CourseID`, `Type`, `Description`, `DueDate`, `MaxScore`, `Weight`, `Instructions`, `AllowLateSubmission`, `LatePenalty`, `CreatedAt`, `UpdatedAt`) VALUES
(1, 1, 'Create a Personal Webpage Using HTML', '### ???? **HTML Course Assignment 1: Build Your First Personal Web Page**\r\n\r\n**Assignment Title:**\r\n*Create a Personal Webpage Using HTML*\r\n\r\n**Objective:**\r\nApply your understanding of basic HTML tags and structure by creating a simple, well-organized personal web page.\r\n\r\n---\r\n\r\n### ???? **Instructions:**\r\n\r\n1. **Create an HTML file** named `index.html`.\r\n\r\n2. Your webpage should include the following elements:\r\n\r\n   * A title in the `<title>` tag\r\n   * A main heading using `<h1>`\r\n   * At least two paragraphs (`<p>`) describing yourself\r\n   * A list (`<ul>` or `<ol>`) of your hobbies or favorite things\r\n   * An image of your choice using the `<img>` tag\r\n   * A hyperlink to an external website (e.g., your favorite blog, YouTube channel, etc.) using `<a>`\r\n   * A footer with your name and the current year\r\n\r\n3. Use proper HTML document structure:\r\n\r\n   ```html\r\n   <!DOCTYPE html>\r\n   <html>\r\n     <head>\r\n       <title>Your Name - Personal Page</title>\r\n     </head>\r\n     <body>\r\n       <!-- Your content here -->\r\n     </body>\r\n   </html>\r\n   ```\r\n\r\n---\r\n\r\n### ✅ **Requirements:**\r\n\r\n* Use semantic HTML where possible\r\n* File should be named `index.html`\r\n* All tags must be properly opened and closed\r\n* Indent code for readability\r\n\r\n---\r\n\r\n### ???? **Submission Guidelines:**\r\n\r\n* Submit your `index.html` file via \\[your platform’s submission system or email].\r\n* Make sure all resources (e.g., images) are included if you use local files.\r\n* Deadline: \\[Insert Date Here]\r\n\r\n---\r\n\r\n### ???? **Grading Criteria:**\r\n\r\n| Criteria                         | Points |\r\n| -------------------------------- | ------ |\r\n| Correct HTML structure           | 10     |\r\n| Use of required elements         | 10     |\r\n| Code readability and indentation | 5      |\r\n| Creativity and completeness      | 5      |\r\n| **Total**                        | **30** |\r\n\r\n\r\n', '2025-06-07', 100, 0.10, NULL, 0, 0.00, '2025-06-11 16:09:29', '2025-06-11 16:09:29');

-- --------------------------------------------------------

--
-- Table structure for table `certificates`
--

CREATE TABLE `certificates` (
  `CertificateID` int(11) NOT NULL,
  `StudentID` int(11) NOT NULL,
  `CourseID` int(11) NOT NULL,
  `CertificateNumber` varchar(50) NOT NULL,
  `IssuedDate` date NOT NULL,
  `FilePath` varchar(255) DEFAULT NULL,
  `VerificationCode` varchar(100) DEFAULT NULL,
  `IsValid` tinyint(1) DEFAULT 1,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `CompanyID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `Name` varchar(128) NOT NULL,
  `Industry` varchar(128) DEFAULT NULL,
  `Location` varchar(128) DEFAULT NULL,
  `CompanySize` int(11) DEFAULT NULL,
  `FoundedDate` date DEFAULT NULL,
  `Bio` text DEFAULT NULL,
  `Website` varchar(255) DEFAULT NULL,
  `VerificationDocument` varchar(255) DEFAULT NULL,
  `ApprovalStatus` enum('Approved','Pending','Rejected') DEFAULT 'Pending',
  `ApprovedBy` int(11) DEFAULT NULL,
  `ApprovedAt` timestamp NULL DEFAULT NULL,
  `RejectionReason` text DEFAULT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `UpdatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `companies`
--

INSERT INTO `companies` (`CompanyID`, `UserID`, `Name`, `Industry`, `Location`, `CompanySize`, `FoundedDate`, `Bio`, `Website`, `VerificationDocument`, `ApprovalStatus`, `ApprovedBy`, `ApprovedAt`, `RejectionReason`, `CreatedAt`, `UpdatedAt`) VALUES
(1, 4, 'RTA', 'IT', 'Cairo', 20, '2024-12-01', NULL, NULL, NULL, 'Pending', NULL, NULL, NULL, '2025-06-11 16:12:28', '2025-06-11 16:12:28');

-- --------------------------------------------------------

--
-- Table structure for table `company_sizes`
--

CREATE TABLE `company_sizes` (
  `SizeID` int(11) NOT NULL,
  `SizeLabel` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `company_sizes`
--

INSERT INTO `company_sizes` (`SizeID`, `SizeLabel`) VALUES
(1, '1-10 employees'),
(6, '1000+ employees'),
(2, '11-50 employees'),
(4, '201-500 employees'),
(5, '501-1000 employees'),
(3, '51-200 employees');

-- --------------------------------------------------------

--
-- Table structure for table `contact_requests`
--

CREATE TABLE `contact_requests` (
  `RequestID` int(11) NOT NULL,
  `UserID` int(11) DEFAULT NULL,
  `Name` varchar(255) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `Subject` varchar(255) NOT NULL,
  `Message` text NOT NULL,
  `Priority` enum('low','normal','high','critical') DEFAULT 'normal',
  `Category` enum('general','technical','billing','course','account','feature','bug','other') DEFAULT 'general',
  `Status` enum('open','in_progress','resolved','closed') DEFAULT 'open',
  `AdminResponse` text DEFAULT NULL,
  `AssignedTo` int(11) DEFAULT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `UpdatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `ResolvedAt` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `CourseID` int(11) NOT NULL,
  `Title` varchar(100) NOT NULL,
  `Description` text DEFAULT NULL,
  `StartDate` date DEFAULT NULL,
  `EndDate` date DEFAULT NULL,
  `Duration` varchar(50) DEFAULT NULL,
  `TypeID` int(11) DEFAULT NULL,
  `RequiredTier` enum('freemium','basic','standard','premium','premium_annual') DEFAULT 'freemium',
  `MaxStudents` int(11) DEFAULT NULL,
  `Price` decimal(10,2) DEFAULT 0.00,
  `IsPublished` tinyint(1) DEFAULT 0,
  `ApprovalStatus` enum('Approved','Pending','Rejected') DEFAULT 'Pending',
  `ApprovedBy` int(11) DEFAULT NULL,
  `ApprovedAt` timestamp NULL DEFAULT NULL,
  `RejectionReason` text DEFAULT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `UpdatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `courses`
--

INSERT INTO `courses` (`CourseID`, `Title`, `Description`, `StartDate`, `EndDate`, `Duration`, `TypeID`, `RequiredTier`, `MaxStudents`, `Price`, `IsPublished`, `ApprovalStatus`, `ApprovedBy`, `ApprovedAt`, `RejectionReason`, `CreatedAt`, `UpdatedAt`) VALUES
(1, 'HTML Fundamentals: Build the Web from Scratch', 'Course Description:\r\nDive into the foundation of the web with this hands-on HTML (HyperText Markup Language) course, designed for absolute beginners and aspiring web developers. In this course, you’ll learn how to structure websites using HTML5 — the core language behind every webpage on the internet.\r\n\r\nFrom creating simple web pages to laying out content with semantic elements, you’ll gain the skills needed to build clean, accessible, and well-organized HTML documents. No prior coding experience is required — just curiosity and a willingness to learn!\r\n\r\nWhat You’ll Learn:\r\n\r\nThe structure and syntax of HTML\r\n\r\nHow to create and organize content with headings, paragraphs, lists, and links\r\n\r\nEmbedding images, videos, and other media\r\n\r\nBuilding forms for user input\r\n\r\nUsing semantic HTML to improve SEO and accessibility\r\n\r\nBest practices for clean, maintainable code\r\n\r\nWho This Course Is For:\r\n\r\nBeginners with no prior coding experience\r\n\r\nStudents exploring web development\r\n\r\nProfessionals looking to understand how websites are built\r\n\r\nAnyone curious about how the internet works\r\n\r\nCourse Outcomes:\r\n\r\nBy the end of this course, you’ll be able to create your own HTML-based webpages, understand how web browsers render content, and be ready to move on to CSS and JavaScript for styling and interactivity.', '2025-06-15', '2025-06-30', '20', NULL, 'freemium', NULL, 0.00, 0, 'Pending', NULL, NULL, NULL, '2025-06-11 16:07:33', '2025-06-11 16:07:33');

-- --------------------------------------------------------

--
-- Table structure for table `course_materials`
--

CREATE TABLE `course_materials` (
  `MaterialID` int(11) NOT NULL,
  `CourseID` int(11) NOT NULL,
  `Title` varchar(100) NOT NULL,
  `Description` text DEFAULT NULL,
  `FilePath` varchar(255) DEFAULT NULL,
  `FileType` varchar(50) DEFAULT NULL,
  `FileSize` bigint(20) DEFAULT NULL,
  `IsPublic` tinyint(1) DEFAULT 1,
  `UploadedBy` int(11) NOT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_prerequisites`
--

CREATE TABLE `course_prerequisites` (
  `CourseID` int(11) NOT NULL,
  `PrerequisiteCourseID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_registrations`
--

CREATE TABLE `course_registrations` (
  `RegistrationID` int(11) NOT NULL,
  `StudentID` int(11) NOT NULL,
  `CourseID` int(11) NOT NULL,
  `RegistrationDate` date NOT NULL,
  `Status` enum('Enrolled','Completed','Dropped','In Progress') DEFAULT 'Enrolled',
  `CompletionDate` date DEFAULT NULL,
  `Grade` varchar(5) DEFAULT NULL,
  `Progress` decimal(5,2) DEFAULT 0.00,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `UpdatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `course_registrations`
--

INSERT INTO `course_registrations` (`RegistrationID`, `StudentID`, `CourseID`, `RegistrationDate`, `Status`, `CompletionDate`, `Grade`, `Progress`, `CreatedAt`, `UpdatedAt`) VALUES
(1, 1, 1, '2025-06-11', 'Enrolled', NULL, NULL, 0.00, '2025-06-11 17:19:50', '2025-06-11 17:19:50');

-- --------------------------------------------------------

--
-- Table structure for table `course_types`
--

CREATE TABLE `course_types` (
  `TypeID` int(11) NOT NULL,
  `TypeLabel` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `course_types`
--

INSERT INTO `course_types` (`TypeID`, `TypeLabel`) VALUES
(9, 'Business Analysis'),
(7, 'Cybersecurity'),
(2, 'Data Science'),
(6, 'DevOps'),
(3, 'Machine Learning'),
(5, 'Mobile Development'),
(1, 'Programming'),
(10, 'Project Management'),
(8, 'UI/UX Design'),
(4, 'Web Development');

-- --------------------------------------------------------

--
-- Table structure for table `faq_items`
--

CREATE TABLE `faq_items` (
  `FAQID` int(11) NOT NULL,
  `Category` varchar(100) NOT NULL,
  `Question` text NOT NULL,
  `Answer` text NOT NULL,
  `SortOrder` int(11) DEFAULT 0,
  `IsActive` tinyint(1) DEFAULT 1,
  `CreatedBy` int(11) DEFAULT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `UpdatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `faq_items`
--

INSERT INTO `faq_items` (`FAQID`, `Category`, `Question`, `Answer`, `SortOrder`, `IsActive`, `CreatedBy`, `CreatedAt`, `UpdatedAt`) VALUES
(1, 'General', 'What is Sec Era Platform?', 'Sec Era is a comprehensive cybersecurity learning platform offering courses, certifications, and hands-on training for security professionals and enthusiasts.', 1, 1, NULL, '2025-06-11 15:31:07', '2025-06-11 15:31:07'),
(2, 'General', 'How do I get started?', 'Simply create an account and choose your learning path. You can start with our free courses or upgrade to premium for full access.', 2, 1, NULL, '2025-06-11 15:31:07', '2025-06-11 15:31:07'),
(3, 'General', 'Is there a mobile app?', 'Currently, we offer a fully responsive web platform. A mobile app is in development and will be available soon.', 3, 1, NULL, '2025-06-11 15:31:07', '2025-06-11 15:31:07'),
(4, 'Subscriptions', 'What subscription plans are available?', 'We offer Freemium (free), Standard ($29/month), and Premium ($99/year) plans with different levels of access to courses and features.', 1, 1, NULL, '2025-06-11 15:31:07', '2025-06-11 15:31:07'),
(5, 'Subscriptions', 'Can I cancel my subscription anytime?', 'Yes, you can cancel your subscription at any time. You will retain access until the end of your billing period.', 2, 1, NULL, '2025-06-11 15:31:07', '2025-06-11 15:31:07'),
(6, 'Subscriptions', 'Do you offer refunds?', 'We offer a 30-day money-back guarantee for all paid subscriptions. Contact support for refund requests.', 3, 1, NULL, '2025-06-11 15:31:07', '2025-06-11 15:31:07'),
(7, 'Courses', 'Are the certifications industry-recognized?', 'Our certifications are recognized by leading cybersecurity organizations and employers worldwide.', 1, 1, NULL, '2025-06-11 15:31:07', '2025-06-11 15:31:07'),
(8, 'Courses', 'Do I need prior experience?', 'We offer courses for all skill levels, from complete beginners to advanced professionals.', 2, 1, NULL, '2025-06-11 15:31:07', '2025-06-11 15:31:07'),
(9, 'Courses', 'How long do courses take to complete?', 'Course duration varies from 2-40 hours depending on the complexity and depth of the subject matter.', 3, 1, NULL, '2025-06-11 15:31:07', '2025-06-11 15:31:07'),
(10, 'Technical', 'I am having trouble accessing my account', 'Try resetting your password. If the issue persists, contact our support team with your email address.', 1, 1, NULL, '2025-06-11 15:31:07', '2025-06-11 15:31:07'),
(11, 'Technical', 'The platform is running slowly', 'Clear your browser cache and cookies. If issues continue, try using a different browser or contact support.', 2, 1, NULL, '2025-06-11 15:31:07', '2025-06-11 15:31:07'),
(12, 'Technical', 'I cannot submit my assignments', 'Ensure your files meet the size and format requirements. Check your internet connection and try again.', 3, 1, NULL, '2025-06-11 15:31:07', '2025-06-11 15:31:07');

-- --------------------------------------------------------

--
-- Table structure for table `instructors`
--

CREATE TABLE `instructors` (
  `InstructorID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `Department` varchar(128) DEFAULT NULL,
  `Specialization` varchar(128) DEFAULT NULL,
  `Experience` int(11) DEFAULT NULL,
  `Bio` text DEFAULT NULL,
  `Qualifications` text DEFAULT NULL,
  `ApprovalStatus` enum('Approved','Pending','Rejected') DEFAULT 'Pending',
  `ApprovedBy` int(11) DEFAULT NULL,
  `ApprovedAt` timestamp NULL DEFAULT NULL,
  `RejectionReason` text DEFAULT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `UpdatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `instructors`
--

INSERT INTO `instructors` (`InstructorID`, `UserID`, `Department`, `Specialization`, `Experience`, `Bio`, `Qualifications`, `ApprovalStatus`, `ApprovedBy`, `ApprovedAt`, `RejectionReason`, `CreatedAt`, `UpdatedAt`) VALUES
(1, 3, 'IT', 'Frontend', 6, NULL, NULL, 'Pending', NULL, NULL, NULL, '2025-06-11 16:04:57', '2025-06-11 16:04:57'),
(2, 6, 'Marketing', 'Sales', 3, NULL, NULL, 'Pending', NULL, NULL, NULL, '2025-06-11 18:52:37', '2025-06-11 18:52:37'),
(3, 11, 'IT', 'Backend', 1, NULL, NULL, 'Approved', 1, '2025-06-11 21:09:12', NULL, '2025-06-11 20:33:09', '2025-06-11 21:09:12');

-- --------------------------------------------------------

--
-- Table structure for table `instructor_courses`
--

CREATE TABLE `instructor_courses` (
  `InstructorID` int(11) NOT NULL,
  `CourseID` int(11) NOT NULL,
  `AssignedDate` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `instructor_courses`
--

INSERT INTO `instructor_courses` (`InstructorID`, `CourseID`, `AssignedDate`) VALUES
(1, 1, '2025-06-11 16:07:33');

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `JobID` int(11) NOT NULL,
  `CompanyID` int(11) NOT NULL,
  `Title` varchar(100) NOT NULL,
  `Description` text DEFAULT NULL,
  `Requirements` text DEFAULT NULL,
  `RequiredCourses` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`RequiredCourses`)),
  `MinSalary` decimal(10,2) DEFAULT NULL,
  `MaxSalary` decimal(10,2) DEFAULT NULL,
  `PostingDate` date NOT NULL,
  `DeadlineDate` date DEFAULT NULL,
  `Type` enum('Full-time','Part-time','Contract','Internship','Remote') DEFAULT 'Full-time',
  `Location` varchar(128) DEFAULT NULL,
  `ExperienceLevel` enum('Entry','Mid','Senior','Executive') DEFAULT 'Entry',
  `IsActive` tinyint(1) NOT NULL DEFAULT 1,
  `IsUrgent` tinyint(1) DEFAULT 0,
  `IsFeatured` tinyint(1) DEFAULT 0,
  `Views` int(11) DEFAULT 0,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `UpdatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `StructuredRequirements` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON structure for automated prerequisite checking' CHECK (json_valid(`StructuredRequirements`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `jobs`
--

INSERT INTO `jobs` (`JobID`, `CompanyID`, `Title`, `Description`, `Requirements`, `RequiredCourses`, `MinSalary`, `MaxSalary`, `PostingDate`, `DeadlineDate`, `Type`, `Location`, `ExperienceLevel`, `IsActive`, `IsUrgent`, `IsFeatured`, `Views`, `CreatedAt`, `UpdatedAt`, `StructuredRequirements`) VALUES
(1, 1, 'Frontend Developer', 'We are looking for a talented and passionate Frontend Developer to join our team! In this role, you will be responsible for creating beautiful, responsive, and user-friendly web interfaces. You’ll work closely with designers, backend developers, and product managers to bring modern web applications to life.\r\n\r\n???? Key Responsibilities:\r\nBuild and maintain modern web interfaces using HTML, CSS, JavaScript, and frameworks like React or Vue.js.\r\n\r\nCollaborate with UX/UI designers to implement responsive and accessible designs.\r\n\r\nOptimize applications for maximum speed and scalability.\r\n\r\nWork with RESTful APIs and backend developers to integrate data services.\r\n\r\nDebug and troubleshoot UI/UX issues and improve usability.', 'Proficiency in HTML, CSS, JavaScript\r\n\r\nExperience with React, Vue.js, or other modern frameworks\r\n\r\nFamiliarity with version control (Git) and code collaboration tools\r\n\r\nKnowledge of responsive design and cross-browser compatibility\r\n\r\nStrong attention to detail and a passion for creating great user experiences\r\n\r\n???? Nice to Have:\r\nExperience with TypeScript, Tailwind CSS, or Webpack\r\nKnowledge of testing tools like Jest or Cypress\r\nPrevious experience working in Agile/Scrum teams\r\n\r\n', NULL, 4000.00, 9000.00, '2025-06-11', '2025-06-30', 'Full-time', 'Cairo', 'Entry', 1, 0, 0, 0, '2025-06-11 16:15:38', '2025-06-11 16:15:38', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `job_applications`
--

CREATE TABLE `job_applications` (
  `ApplicationID` int(11) NOT NULL,
  `JobID` int(11) NOT NULL,
  `StudentID` int(11) NOT NULL,
  `ApplicationDate` timestamp NOT NULL DEFAULT current_timestamp(),
  `StatusID` int(11) DEFAULT 1,
  `ResumePath` varchar(255) DEFAULT NULL,
  `CoverLetter` text DEFAULT NULL,
  `ReviewedBy` int(11) DEFAULT NULL,
  `ReviewedAt` timestamp NULL DEFAULT NULL,
  `InterviewDate` timestamp NULL DEFAULT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `UpdatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `PrerequisiteScore` decimal(5,2) DEFAULT 0.00 COMMENT 'Percentage score of how well student meets prerequisites (0-100)',
  `Notes` text DEFAULT NULL COMMENT 'JSON data containing prerequisite check results and recommendations'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `job_applications`
--

INSERT INTO `job_applications` (`ApplicationID`, `JobID`, `StudentID`, `ApplicationDate`, `StatusID`, `ResumePath`, `CoverLetter`, `ReviewedBy`, `ReviewedAt`, `InterviewDate`, `CreatedAt`, `UpdatedAt`, `PrerequisiteScore`, `Notes`) VALUES
(1, 1, 1, '2025-06-10 21:00:00', 4, NULL, 'Good Grade', NULL, NULL, NULL, '2025-06-11 17:20:46', '2025-06-11 17:23:24', 0.00, '{\"eligible\": false, \"reason\": \"Job not found\"}');

-- --------------------------------------------------------

--
-- Table structure for table `job_recommendations`
--

CREATE TABLE `job_recommendations` (
  `RecommendationID` int(11) NOT NULL,
  `StudentID` int(11) NOT NULL,
  `JobID` int(11) NOT NULL,
  `RecommendationScore` decimal(5,2) NOT NULL,
  `RecommendationReason` text DEFAULT NULL,
  `IsViewed` tinyint(1) DEFAULT 0,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `StudentID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `University` varchar(128) DEFAULT NULL,
  `Major` varchar(64) DEFAULT NULL,
  `GPA` float DEFAULT NULL,
  `ExpectedGraduationDate` date DEFAULT NULL,
  `ResumeFile` varchar(255) DEFAULT NULL,
  `Bio` text DEFAULT NULL,
  `SubscriptionTier` enum('freemium','basic','standard','premium','premium_annual') DEFAULT 'freemium',
  `SubscriptionStatus` enum('active','inactive','cancelled','expired') DEFAULT 'active',
  `SubscriptionStart` date DEFAULT NULL,
  `SubscriptionEnd` date DEFAULT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `UpdatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`StudentID`, `UserID`, `University`, `Major`, `GPA`, `ExpectedGraduationDate`, `ResumeFile`, `Bio`, `SubscriptionTier`, `SubscriptionStatus`, `SubscriptionStart`, `SubscriptionEnd`, `CreatedAt`, `UpdatedAt`) VALUES
(1, 2, 'Helwan', 'BIS', 3.6, '2025-06-30', NULL, NULL, 'freemium', 'active', NULL, NULL, '2025-06-11 16:01:27', '2025-06-11 16:01:27'),
(2, 5, 'Cairo', 'Commerce', 4, '2025-06-25', NULL, NULL, 'freemium', 'active', NULL, NULL, '2025-06-11 18:44:32', '2025-06-11 18:44:32');

-- --------------------------------------------------------

--
-- Table structure for table `student_assessments`
--

CREATE TABLE `student_assessments` (
  `StudentID` int(11) NOT NULL,
  `AssessmentID` int(11) NOT NULL,
  `Score` float DEFAULT NULL,
  `SubmissionDate` timestamp NULL DEFAULT NULL,
  `Status` enum('Not Started','In Progress','Submitted','Graded','Late') DEFAULT 'Not Started',
  `Feedback` text DEFAULT NULL,
  `SubmissionFile` varchar(255) DEFAULT NULL,
  `Attempts` int(11) DEFAULT 0,
  `TimeSpent` int(11) DEFAULT 0,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `UpdatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_assessments`
--

INSERT INTO `student_assessments` (`StudentID`, `AssessmentID`, `Score`, `SubmissionDate`, `Status`, `Feedback`, `SubmissionFile`, `Attempts`, `TimeSpent`, `CreatedAt`, `UpdatedAt`) VALUES
(1, 1, 100, '2025-06-11 17:20:15', '', 'Good Job', NULL, 0, 0, '2025-06-11 17:20:15', '2025-06-11 17:21:45');

-- --------------------------------------------------------

--
-- Table structure for table `subscription_payments`
--

CREATE TABLE `subscription_payments` (
  `PaymentID` int(11) NOT NULL,
  `StudentID` int(11) NOT NULL,
  `PlanID` int(11) NOT NULL,
  `Amount` decimal(10,2) NOT NULL,
  `PaymentDate` timestamp NOT NULL DEFAULT current_timestamp(),
  `PaymentMethod` varchar(50) DEFAULT NULL,
  `TransactionID` varchar(100) DEFAULT NULL,
  `Status` enum('pending','completed','failed','refunded') DEFAULT 'pending',
  `IsInstallment` tinyint(1) DEFAULT 0,
  `InstallmentNumber` int(11) DEFAULT NULL,
  `TotalInstallments` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subscription_plans`
--

CREATE TABLE `subscription_plans` (
  `PlanID` int(11) NOT NULL,
  `Name` varchar(50) NOT NULL,
  `Description` text DEFAULT NULL,
  `Price` decimal(10,2) NOT NULL,
  `BillingCycle` enum('monthly','annual') NOT NULL,
  `Features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`Features`)),
  `IsActive` tinyint(1) DEFAULT 1,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `UpdatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subscription_plans`
--

INSERT INTO `subscription_plans` (`PlanID`, `Name`, `Description`, `Price`, `BillingCycle`, `Features`, `IsActive`, `CreatedAt`, `UpdatedAt`) VALUES
(1, 'Freemium', 'Free access to introductory courses', 0.00, 'monthly', '{\"courses\": \"intro_only\", \"certifications\": \"paid\", \"support\": \"community\", \"materials\": \"limited\"}', 1, '2025-06-11 15:30:35', '2025-06-11 15:30:35'),
(2, 'Basic Plan', 'Access to recordings and materials', 29.99, 'monthly', '{\"courses\": \"recordings\", \"certifications\": \"included\", \"support\": \"email\", \"materials\": \"full\", \"live_sessions\": false}', 1, '2025-06-11 15:30:35', '2025-06-11 15:30:35'),
(3, 'Standard Plan', 'Live sessions and interactive assessments', 49.99, 'monthly', '{\"courses\": \"live_and_recorded\", \"certifications\": \"included\", \"support\": \"priority\", \"materials\": \"full\", \"live_sessions\": true, \"assessments\": \"interactive\"}', 1, '2025-06-11 15:30:35', '2025-06-11 15:30:35'),
(4, 'Premium Plan', 'All features with personalized coaching', 99.99, 'monthly', '{\"courses\": \"all\", \"certifications\": \"included\", \"support\": \"24_7\", \"materials\": \"full\", \"live_sessions\": true, \"assessments\": \"interactive\", \"coaching\": true, \"internships\": true}', 1, '2025-06-11 15:30:35', '2025-06-11 15:30:35'),
(5, 'Premium Annual', 'Premium features with annual billing', 999.99, 'annual', '{\"courses\": \"all\", \"certifications\": \"included\", \"support\": \"24_7\", \"materials\": \"full\", \"live_sessions\": true, \"assessments\": \"interactive\", \"coaching\": true, \"internships\": true, \"installments\": true}', 1, '2025-06-11 15:30:35', '2025-06-11 15:30:35');

-- --------------------------------------------------------

--
-- Table structure for table `system_announcements`
--

CREATE TABLE `system_announcements` (
  `AnnouncementID` int(11) NOT NULL,
  `Title` varchar(255) NOT NULL,
  `Content` text NOT NULL,
  `Type` enum('info','warning','success','danger') DEFAULT 'info',
  `Priority` enum('low','normal','high') DEFAULT 'normal',
  `TargetAudience` enum('all','students','instructors','companies','admins') DEFAULT 'all',
  `IsActive` tinyint(1) DEFAULT 1,
  `StartDate` timestamp NULL DEFAULT NULL,
  `EndDate` timestamp NULL DEFAULT NULL,
  `CreatedBy` int(11) DEFAULT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `UpdatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `SettingID` int(11) NOT NULL,
  `SettingKey` varchar(100) NOT NULL,
  `SettingValue` text DEFAULT NULL,
  `Description` text DEFAULT NULL,
  `IsPublic` tinyint(1) DEFAULT 0,
  `UpdatedBy` int(11) DEFAULT NULL,
  `UpdatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`SettingID`, `SettingKey`, `SettingValue`, `Description`, `IsPublic`, `UpdatedBy`, `UpdatedAt`) VALUES
(1, 'site_name', 'Sec Era Platform', 'Name of the platform', 1, NULL, '2025-06-11 15:30:35'),
(2, 'site_description', 'Advanced Learning Management System', 'Description of the platform', 1, NULL, '2025-06-11 15:30:35'),
(3, 'max_file_size', '16777216', 'Maximum file upload size in bytes (16MB)', 0, NULL, '2025-06-11 15:30:35'),
(4, 'allowed_file_types', 'pdf,doc,docx,txt,zip', 'Allowed file extensions for uploads', 0, NULL, '2025-06-11 15:30:35'),
(5, 'email_notifications', '1', 'Enable email notifications', 0, NULL, '2025-06-11 15:30:35'),
(6, 'course_approval_required', '1', 'Require admin approval for new courses', 0, NULL, '2025-06-11 15:30:35'),
(7, 'instructor_approval_required', '1', 'Require admin approval for new instructors', 0, NULL, '2025-06-11 15:30:35'),
(8, 'company_approval_required', '1', 'Require admin approval for new companies', 0, NULL, '2025-06-11 15:30:35');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `UserID` int(11) NOT NULL,
  `First` varchar(64) NOT NULL,
  `Last` varchar(64) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `UserType` enum('student','instructor','company','admin') NOT NULL,
  `ProfilePicture` varchar(255) DEFAULT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `UpdatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `Status` enum('Active','Inactive','Pending','Suspended') NOT NULL DEFAULT 'Active',
  `ApprovalStatus` enum('Approved','Pending','Rejected') DEFAULT 'Pending',
  `ApprovedBy` int(11) DEFAULT NULL,
  `ApprovedAt` timestamp NULL DEFAULT NULL,
  `LastLogin` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`UserID`, `First`, `Last`, `Email`, `Password`, `UserType`, `ProfilePicture`, `CreatedAt`, `UpdatedAt`, `Status`, `ApprovalStatus`, `ApprovedBy`, `ApprovedAt`, `LastLogin`) VALUES
(1, 'System', 'Administrator', 'admin@secera.com', 'scrypt:32768:8:1$mfJ6GW9x55t3JEIi$a00f002b1e132721089ae3c42f9d7aacb088be7682a5b3989e13dec7756b3688a0a535d4d22ffcf2cdb409bb9ab6f5e88927c3de41d5269c866930798e138a6d', 'admin', NULL, '2025-06-11 15:30:35', '2025-06-11 21:20:31', 'Active', 'Approved', NULL, NULL, NULL),
(2, 'Alex', 'Alpha', 'Student1@mail.com', 'scrypt:32768:8:1$ZezjtpIJSL6PEtZl$19c2ff1b3fd4a62c5a67285b492a10faa8fd8a38316113e70e50388264f37195f5e73f446141482ba826bc4f839fdbc9bffe3b39dcd63c529820e417b50d9848', 'student', NULL, '2025-06-11 16:01:27', '2025-06-11 17:23:42', 'Active', 'Approved', NULL, NULL, NULL),
(3, 'Alex', 'Beta', 'inst1@mail.com', 'scrypt:32768:8:1$mznO0KRQ7NjhMOsa$360a7b17fae384f11341cba161b691f5935546529a009678b8f559fa7eb49819b4e9135171d337b2b6bbf83a6540709ca2107db4d5b3296b4f736204d8826d26', 'instructor', NULL, '2025-06-11 16:04:57', '2025-06-11 17:20:53', 'Active', 'Approved', NULL, NULL, NULL),
(4, 'Alex', 'Delta', 'com1@mail.com', 'scrypt:32768:8:1$ipBKzBu7wuTpogvj$43ba8cfe90aa654d30fc635d009843b6520a883c383f381c59fe454f258e4436e5182184b5e68c0fbb5ea9d85a30d0b9aaebb6d9e6df4739c48c2bc79888024c', 'company', NULL, '2025-06-11 16:12:28', '2025-06-11 17:21:51', 'Active', 'Approved', NULL, NULL, NULL),
(5, 'Alex', 'Gama', 'Student2@mail.com', 'scrypt:32768:8:1$IJRSRl7HTOUekbvM$91ed4e3a7ace5001335924d2764a0154376075b0d2057f4e5e2c59092f9dbae1dc4d7556dfd5ca709f384927bde5d791aa22c8215edb3e6d879b17d3039ecdb3', 'student', NULL, '2025-06-11 18:44:32', '2025-06-11 18:44:32', 'Active', NULL, NULL, NULL, NULL),
(6, 'Alex', 'Segma', 'inst2@mail.com', 'scrypt:32768:8:1$Nn1MhkOwLRB3zsaQ$f8ebfefb48bffa5935de01e9f23f54f22ac7de426658a757b52575d61ef8ec8d7ceaed7391512422d1c77a5f2144f5a2559adc973b86371b83a4d946f339b7dc', 'instructor', NULL, '2025-06-11 18:52:37', '2025-06-11 18:52:37', 'Active', NULL, NULL, NULL, NULL),
(7, '', '', '', '', 'student', NULL, '2025-06-11 18:52:37', '2025-06-11 18:52:37', 'Active', 'Pending', NULL, NULL, NULL),
(11, 'Ahmed', 'Alpha', 'inst3@mail.com', 'scrypt:32768:8:1$h31ru0qDpOHubX37$bc042ba0d941a50b6f865e821918181086ab50e61fe718e884e15a7ec35adb6c17e23c8b1430e8478e028c22ca940967c650a983be701cb9b5113019870ff0ff', 'instructor', NULL, '2025-06-11 20:33:09', '2025-06-11 21:09:12', 'Active', 'Approved', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_activity_log`
--

CREATE TABLE `user_activity_log` (
  `LogID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `ActivityType` varchar(50) NOT NULL,
  `ActivityDescription` text DEFAULT NULL,
  `Timestamp` datetime DEFAULT current_timestamp(),
  `IPAddress` varchar(45) DEFAULT NULL,
  `UserAgent` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_skills`
--

CREATE TABLE `user_skills` (
  `SkillID` int(11) NOT NULL,
  `StudentID` int(11) NOT NULL,
  `SkillName` varchar(255) NOT NULL,
  `ProficiencyLevel` enum('beginner','intermediate','advanced','expert') DEFAULT 'beginner',
  `VerifiedDate` timestamp NULL DEFAULT NULL,
  `VerificationMethod` enum('course_completion','certification','assessment','self_reported') DEFAULT 'self_reported',
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `UpdatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_activity_log`
--
ALTER TABLE `admin_activity_log`
  ADD PRIMARY KEY (`LogID`),
  ADD KEY `AdminID` (`AdminID`),
  ADD KEY `idx_action` (`Action`),
  ADD KEY `idx_target` (`TargetType`,`TargetID`),
  ADD KEY `idx_created_at` (`CreatedAt`);

--
-- Indexes for table `application_feedback`
--
ALTER TABLE `application_feedback`
  ADD PRIMARY KEY (`FeedbackID`),
  ADD KEY `idx_application_feedback` (`ApplicationID`),
  ADD KEY `idx_feedback_type` (`FeedbackType`),
  ADD KEY `idx_priority` (`Priority`),
  ADD KEY `idx_completed` (`IsCompleted`);

--
-- Indexes for table `application_statuses`
--
ALTER TABLE `application_statuses`
  ADD PRIMARY KEY (`StatusID`),
  ADD UNIQUE KEY `Name` (`Name`);

--
-- Indexes for table `assessments`
--
ALTER TABLE `assessments`
  ADD PRIMARY KEY (`AssessID`),
  ADD KEY `CourseID` (`CourseID`),
  ADD KEY `idx_due_date` (`DueDate`);

--
-- Indexes for table `certificates`
--
ALTER TABLE `certificates`
  ADD PRIMARY KEY (`CertificateID`),
  ADD UNIQUE KEY `CertificateNumber` (`CertificateNumber`),
  ADD KEY `StudentID` (`StudentID`),
  ADD KEY `CourseID` (`CourseID`),
  ADD KEY `idx_certificate_number` (`CertificateNumber`),
  ADD KEY `idx_verification_code` (`VerificationCode`);

--
-- Indexes for table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`CompanyID`),
  ADD KEY `UserID` (`UserID`),
  ADD KEY `ApprovedBy` (`ApprovedBy`),
  ADD KEY `idx_approval_status` (`ApprovalStatus`);

--
-- Indexes for table `company_sizes`
--
ALTER TABLE `company_sizes`
  ADD PRIMARY KEY (`SizeID`),
  ADD UNIQUE KEY `SizeLabel` (`SizeLabel`);

--
-- Indexes for table `contact_requests`
--
ALTER TABLE `contact_requests`
  ADD PRIMARY KEY (`RequestID`),
  ADD KEY `AssignedTo` (`AssignedTo`),
  ADD KEY `idx_status` (`Status`),
  ADD KEY `idx_priority` (`Priority`),
  ADD KEY `idx_category` (`Category`),
  ADD KEY `idx_created_at` (`CreatedAt`),
  ADD KEY `idx_user_id` (`UserID`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`CourseID`),
  ADD KEY `TypeID` (`TypeID`),
  ADD KEY `ApprovedBy` (`ApprovedBy`),
  ADD KEY `idx_approval_status` (`ApprovalStatus`),
  ADD KEY `idx_published` (`IsPublished`),
  ADD KEY `idx_required_tier` (`RequiredTier`);

--
-- Indexes for table `course_materials`
--
ALTER TABLE `course_materials`
  ADD PRIMARY KEY (`MaterialID`),
  ADD KEY `CourseID` (`CourseID`),
  ADD KEY `UploadedBy` (`UploadedBy`);

--
-- Indexes for table `course_prerequisites`
--
ALTER TABLE `course_prerequisites`
  ADD PRIMARY KEY (`CourseID`,`PrerequisiteCourseID`),
  ADD KEY `PrerequisiteCourseID` (`PrerequisiteCourseID`);

--
-- Indexes for table `course_registrations`
--
ALTER TABLE `course_registrations`
  ADD PRIMARY KEY (`RegistrationID`),
  ADD UNIQUE KEY `unique_enrollment` (`StudentID`,`CourseID`),
  ADD KEY `CourseID` (`CourseID`),
  ADD KEY `idx_status` (`Status`);

--
-- Indexes for table `course_types`
--
ALTER TABLE `course_types`
  ADD PRIMARY KEY (`TypeID`),
  ADD UNIQUE KEY `TypeLabel` (`TypeLabel`);

--
-- Indexes for table `faq_items`
--
ALTER TABLE `faq_items`
  ADD PRIMARY KEY (`FAQID`),
  ADD KEY `CreatedBy` (`CreatedBy`),
  ADD KEY `idx_category` (`Category`),
  ADD KEY `idx_active` (`IsActive`),
  ADD KEY `idx_sort_order` (`SortOrder`);

--
-- Indexes for table `instructors`
--
ALTER TABLE `instructors`
  ADD PRIMARY KEY (`InstructorID`),
  ADD KEY `UserID` (`UserID`),
  ADD KEY `ApprovedBy` (`ApprovedBy`),
  ADD KEY `idx_approval_status` (`ApprovalStatus`);

--
-- Indexes for table `instructor_courses`
--
ALTER TABLE `instructor_courses`
  ADD PRIMARY KEY (`InstructorID`,`CourseID`),
  ADD KEY `CourseID` (`CourseID`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`JobID`),
  ADD KEY `CompanyID` (`CompanyID`),
  ADD KEY `idx_posting_date` (`PostingDate`),
  ADD KEY `idx_deadline` (`DeadlineDate`),
  ADD KEY `idx_active` (`IsActive`),
  ADD KEY `idx_type` (`Type`);

--
-- Indexes for table `job_applications`
--
ALTER TABLE `job_applications`
  ADD PRIMARY KEY (`ApplicationID`),
  ADD UNIQUE KEY `unique_application` (`JobID`,`StudentID`),
  ADD KEY `StudentID` (`StudentID`),
  ADD KEY `StatusID` (`StatusID`),
  ADD KEY `ReviewedBy` (`ReviewedBy`),
  ADD KEY `idx_application_date` (`ApplicationDate`),
  ADD KEY `idx_prerequisite_score` (`PrerequisiteScore`);

--
-- Indexes for table `job_recommendations`
--
ALTER TABLE `job_recommendations`
  ADD PRIMARY KEY (`RecommendationID`),
  ADD UNIQUE KEY `unique_recommendation` (`StudentID`,`JobID`),
  ADD KEY `JobID` (`JobID`),
  ADD KEY `idx_student_recommendations` (`StudentID`),
  ADD KEY `idx_score` (`RecommendationScore`),
  ADD KEY `idx_viewed` (`IsViewed`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`StudentID`),
  ADD KEY `UserID` (`UserID`),
  ADD KEY `idx_subscription` (`SubscriptionTier`,`SubscriptionStatus`);

--
-- Indexes for table `student_assessments`
--
ALTER TABLE `student_assessments`
  ADD PRIMARY KEY (`StudentID`,`AssessmentID`),
  ADD KEY `AssessmentID` (`AssessmentID`),
  ADD KEY `idx_status` (`Status`);

--
-- Indexes for table `subscription_payments`
--
ALTER TABLE `subscription_payments`
  ADD PRIMARY KEY (`PaymentID`),
  ADD KEY `StudentID` (`StudentID`),
  ADD KEY `PlanID` (`PlanID`);

--
-- Indexes for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  ADD PRIMARY KEY (`PlanID`);

--
-- Indexes for table `system_announcements`
--
ALTER TABLE `system_announcements`
  ADD PRIMARY KEY (`AnnouncementID`),
  ADD KEY `CreatedBy` (`CreatedBy`),
  ADD KEY `idx_active` (`IsActive`),
  ADD KEY `idx_type` (`Type`),
  ADD KEY `idx_target` (`TargetAudience`),
  ADD KEY `idx_dates` (`StartDate`,`EndDate`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`SettingID`),
  ADD UNIQUE KEY `SettingKey` (`SettingKey`),
  ADD KEY `UpdatedBy` (`UpdatedBy`),
  ADD KEY `idx_setting_key` (`SettingKey`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`UserID`),
  ADD UNIQUE KEY `Email` (`Email`),
  ADD KEY `ApprovedBy` (`ApprovedBy`),
  ADD KEY `idx_email` (`Email`),
  ADD KEY `idx_user_type` (`UserType`),
  ADD KEY `idx_status` (`Status`);

--
-- Indexes for table `user_activity_log`
--
ALTER TABLE `user_activity_log`
  ADD PRIMARY KEY (`LogID`),
  ADD KEY `UserID` (`UserID`);

--
-- Indexes for table `user_skills`
--
ALTER TABLE `user_skills`
  ADD PRIMARY KEY (`SkillID`),
  ADD UNIQUE KEY `unique_student_skill` (`StudentID`,`SkillName`),
  ADD KEY `idx_student_skills` (`StudentID`),
  ADD KEY `idx_skill_name` (`SkillName`),
  ADD KEY `idx_proficiency` (`ProficiencyLevel`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_activity_log`
--
ALTER TABLE `admin_activity_log`
  MODIFY `LogID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `application_feedback`
--
ALTER TABLE `application_feedback`
  MODIFY `FeedbackID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `application_statuses`
--
ALTER TABLE `application_statuses`
  MODIFY `StatusID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `assessments`
--
ALTER TABLE `assessments`
  MODIFY `AssessID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `certificates`
--
ALTER TABLE `certificates`
  MODIFY `CertificateID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `companies`
--
ALTER TABLE `companies`
  MODIFY `CompanyID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `company_sizes`
--
ALTER TABLE `company_sizes`
  MODIFY `SizeID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `contact_requests`
--
ALTER TABLE `contact_requests`
  MODIFY `RequestID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `CourseID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `course_materials`
--
ALTER TABLE `course_materials`
  MODIFY `MaterialID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_registrations`
--
ALTER TABLE `course_registrations`
  MODIFY `RegistrationID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `course_types`
--
ALTER TABLE `course_types`
  MODIFY `TypeID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `faq_items`
--
ALTER TABLE `faq_items`
  MODIFY `FAQID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `instructors`
--
ALTER TABLE `instructors`
  MODIFY `InstructorID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `JobID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `job_applications`
--
ALTER TABLE `job_applications`
  MODIFY `ApplicationID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `job_recommendations`
--
ALTER TABLE `job_recommendations`
  MODIFY `RecommendationID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `StudentID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `subscription_payments`
--
ALTER TABLE `subscription_payments`
  MODIFY `PaymentID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  MODIFY `PlanID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `system_announcements`
--
ALTER TABLE `system_announcements`
  MODIFY `AnnouncementID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `SettingID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `UserID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `user_activity_log`
--
ALTER TABLE `user_activity_log`
  MODIFY `LogID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_skills`
--
ALTER TABLE `user_skills`
  MODIFY `SkillID` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin_activity_log`
--
ALTER TABLE `admin_activity_log`
  ADD CONSTRAINT `admin_activity_log_ibfk_1` FOREIGN KEY (`AdminID`) REFERENCES `users` (`UserID`);

--
-- Constraints for table `application_feedback`
--
ALTER TABLE `application_feedback`
  ADD CONSTRAINT `application_feedback_ibfk_1` FOREIGN KEY (`ApplicationID`) REFERENCES `job_applications` (`ApplicationID`) ON DELETE CASCADE;

--
-- Constraints for table `assessments`
--
ALTER TABLE `assessments`
  ADD CONSTRAINT `assessments_ibfk_1` FOREIGN KEY (`CourseID`) REFERENCES `courses` (`CourseID`) ON DELETE CASCADE;

--
-- Constraints for table `certificates`
--
ALTER TABLE `certificates`
  ADD CONSTRAINT `certificates_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `students` (`StudentID`) ON DELETE CASCADE,
  ADD CONSTRAINT `certificates_ibfk_2` FOREIGN KEY (`CourseID`) REFERENCES `courses` (`CourseID`) ON DELETE CASCADE;

--
-- Constraints for table `companies`
--
ALTER TABLE `companies`
  ADD CONSTRAINT `companies_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE;

--
-- Constraints for table `contact_requests`
--
ALTER TABLE `contact_requests`
  ADD CONSTRAINT `contact_requests_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE SET NULL,
  ADD CONSTRAINT `contact_requests_ibfk_2` FOREIGN KEY (`AssignedTo`) REFERENCES `users` (`UserID`) ON DELETE SET NULL;

--
-- Constraints for table `courses`
--
ALTER TABLE `courses`
  ADD CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`TypeID`) REFERENCES `course_types` (`TypeID`);

--
-- Constraints for table `course_materials`
--
ALTER TABLE `course_materials`
  ADD CONSTRAINT `course_materials_ibfk_1` FOREIGN KEY (`CourseID`) REFERENCES `courses` (`CourseID`) ON DELETE CASCADE,
  ADD CONSTRAINT `course_materials_ibfk_2` FOREIGN KEY (`UploadedBy`) REFERENCES `users` (`UserID`);

--
-- Constraints for table `course_prerequisites`
--
ALTER TABLE `course_prerequisites`
  ADD CONSTRAINT `course_prerequisites_ibfk_1` FOREIGN KEY (`CourseID`) REFERENCES `courses` (`CourseID`) ON DELETE CASCADE,
  ADD CONSTRAINT `course_prerequisites_ibfk_2` FOREIGN KEY (`PrerequisiteCourseID`) REFERENCES `courses` (`CourseID`) ON DELETE CASCADE;

--
-- Constraints for table `course_registrations`
--
ALTER TABLE `course_registrations`
  ADD CONSTRAINT `course_registrations_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `students` (`StudentID`) ON DELETE CASCADE,
  ADD CONSTRAINT `course_registrations_ibfk_2` FOREIGN KEY (`CourseID`) REFERENCES `courses` (`CourseID`) ON DELETE CASCADE;

--
-- Constraints for table `faq_items`
--
ALTER TABLE `faq_items`
  ADD CONSTRAINT `faq_items_ibfk_1` FOREIGN KEY (`CreatedBy`) REFERENCES `users` (`UserID`) ON DELETE SET NULL;

--
-- Constraints for table `instructors`
--
ALTER TABLE `instructors`
  ADD CONSTRAINT `instructors_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE;

--
-- Constraints for table `instructor_courses`
--
ALTER TABLE `instructor_courses`
  ADD CONSTRAINT `instructor_courses_ibfk_1` FOREIGN KEY (`InstructorID`) REFERENCES `instructors` (`InstructorID`) ON DELETE CASCADE,
  ADD CONSTRAINT `instructor_courses_ibfk_2` FOREIGN KEY (`CourseID`) REFERENCES `courses` (`CourseID`) ON DELETE CASCADE;

--
-- Constraints for table `jobs`
--
ALTER TABLE `jobs`
  ADD CONSTRAINT `jobs_ibfk_1` FOREIGN KEY (`CompanyID`) REFERENCES `companies` (`CompanyID`) ON DELETE CASCADE;

--
-- Constraints for table `job_applications`
--
ALTER TABLE `job_applications`
  ADD CONSTRAINT `job_applications_ibfk_1` FOREIGN KEY (`JobID`) REFERENCES `jobs` (`JobID`) ON DELETE CASCADE,
  ADD CONSTRAINT `job_applications_ibfk_2` FOREIGN KEY (`StudentID`) REFERENCES `students` (`StudentID`) ON DELETE CASCADE,
  ADD CONSTRAINT `job_applications_ibfk_3` FOREIGN KEY (`StatusID`) REFERENCES `application_statuses` (`StatusID`),
  ADD CONSTRAINT `job_applications_ibfk_4` FOREIGN KEY (`ReviewedBy`) REFERENCES `users` (`UserID`);

--
-- Constraints for table `job_recommendations`
--
ALTER TABLE `job_recommendations`
  ADD CONSTRAINT `job_recommendations_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `students` (`StudentID`) ON DELETE CASCADE,
  ADD CONSTRAINT `job_recommendations_ibfk_2` FOREIGN KEY (`JobID`) REFERENCES `jobs` (`JobID`) ON DELETE CASCADE;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `students_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE;

--
-- Constraints for table `student_assessments`
--
ALTER TABLE `student_assessments`
  ADD CONSTRAINT `student_assessments_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `students` (`StudentID`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_assessments_ibfk_2` FOREIGN KEY (`AssessmentID`) REFERENCES `assessments` (`AssessID`) ON DELETE CASCADE;

--
-- Constraints for table `subscription_payments`
--
ALTER TABLE `subscription_payments`
  ADD CONSTRAINT `subscription_payments_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `students` (`StudentID`) ON DELETE CASCADE,
  ADD CONSTRAINT `subscription_payments_ibfk_2` FOREIGN KEY (`PlanID`) REFERENCES `subscription_plans` (`PlanID`);

--
-- Constraints for table `system_announcements`
--
ALTER TABLE `system_announcements`
  ADD CONSTRAINT `system_announcements_ibfk_1` FOREIGN KEY (`CreatedBy`) REFERENCES `users` (`UserID`) ON DELETE SET NULL;

--
-- Constraints for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD CONSTRAINT `system_settings_ibfk_1` FOREIGN KEY (`UpdatedBy`) REFERENCES `users` (`UserID`);

--
-- Constraints for table `user_activity_log`
--
ALTER TABLE `user_activity_log`
  ADD CONSTRAINT `user_activity_log_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE;

--
-- Constraints for table `user_skills`
--
ALTER TABLE `user_skills`
  ADD CONSTRAINT `user_skills_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `students` (`StudentID`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
