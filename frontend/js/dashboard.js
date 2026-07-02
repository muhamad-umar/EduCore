document.addEventListener("DOMContentLoaded", async () => {
    const supabase = window.Supabase;

    if (!supabase) {
        console.error("Supabase client not found.");
        return;
    }

    // Auth check
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
        window.location.href = "login.html";
        return;
    }

    const user = session.user;
    const fullName = user.user_metadata?.full_name || 'Admin';
    if(document.getElementById('userName')) document.getElementById('userName').innerText = fullName.split(' ')[0];

    // Check Role
    let isAdmin = false;
    try {
        const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
        isAdmin = roleData?.role === 'admin';
    } catch(err) {}

    if (!isAdmin) {
        if(document.getElementById('userName')) document.getElementById('userName').innerText += " (Read-Only)";
        document.querySelectorAll('.btn-primary').forEach(btn => {
            if(btn.innerText.includes('Add') || btn.innerText.includes('Register')) btn.style.display = 'none';
        });
    }

    // Show dashboard layout
    document.getElementById('loadingIndicator').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'block';

    // Global State
    let students = [];
    let courses = [];
    let registrations = [];

    // Setup logout
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = "login.html";
    });

    // -------------------------------------------------------------------------
    // Sidebar Navigation Logic
    // -------------------------------------------------------------------------
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.dashboard-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update active nav
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            // Hide all sections, show target
            sections.forEach(sec => sec.style.display = 'none');
            const target = item.getAttribute('data-target');
            document.getElementById(target).style.display = 'block';
        });
    });

    // -------------------------------------------------------------------------
    // Data Fetching and Rendering
    // -------------------------------------------------------------------------
    
    // Overview Fetcher
    async function loadOverview() {
        document.getElementById('totalStudents').innerText = students.length;
        document.getElementById('totalCourses').innerText = courses.length;
        document.getElementById('totalRegistrations').innerText = registrations.length;
    }

    // Students
    async function loadStudents() {
        const { data, error } = await supabase.from('Student').select('*').order('student_id', { ascending: true });
        if (!error && data) {
            students = data;
            renderStudents(students);
            populateDropdowns();
            loadOverview();
        }
    }

    function renderStudents(dataToRender) {
        const tbody = document.getElementById('studentsTableBody');
        if (dataToRender.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No students found.</td></tr>';
            return;
        }
        tbody.innerHTML = dataToRender.map(s => `
            <tr>
                <td>${s.student_id}</td>
                <td><span class="clickable-link" onclick="viewStudentCourses(${s.student_id}, '${s.name.replace(/'/g, "\\'")}')">${s.name}</span></td>
                <td>${s.email}</td>
                <td>${s.phone || ''}</td>
                <td style="text-align: right;">
                    ${isAdmin ? `
                    <button class="action-btn edit" onclick="editStudent(${s.student_id})" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="action-btn delete" onclick="deleteStudent(${s.student_id})" title="Delete"><i class="fa-solid fa-trash"></i></button>
                    ` : '<span style="color: var(--text-muted); font-size: 0.85rem;">Read Only</span>'}
                </td>
            </tr>
        `).join('');
    }

    // Courses
    async function loadCourses() {
        const { data, error } = await supabase.from('Course').select('*').order('course_id', { ascending: true });
        if (!error && data) {
            courses = data;
            renderCourses(courses);
            populateDropdowns();
            loadOverview();
        }
    }

    function renderCourses(dataToRender) {
        const tbody = document.getElementById('coursesTableBody');
        if (dataToRender.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No courses found.</td></tr>';
            return;
        }
        tbody.innerHTML = dataToRender.map(c => `
            <tr>
                <td>${c.course_id}</td>
                <td><span class="clickable-link" onclick="viewCourseStudents(${c.course_id}, '${c.course_name.replace(/'/g, "\\'")}')">${c.course_name}</span></td>
                <td>${c.credit_hours}</td>
                <td style="text-align: right;">
                    ${isAdmin ? `
                    <button class="action-btn edit" onclick="editCourse(${c.course_id})" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="action-btn delete" onclick="deleteCourse(${c.course_id})" title="Delete"><i class="fa-solid fa-trash"></i></button>
                    ` : '<span style="color: var(--text-muted); font-size: 0.85rem;">Read Only</span>'}
                </td>
            </tr>
        `).join('');
    }

    // Registrations
    async function loadRegistrations() {
        // Fetch registrations with student and course details using join
        const { data, error } = await supabase.from('Registration').select(`
            registration_id,
            student_id,
            course_id,
            registration_date,
            Student ( name ),
            Course ( course_name )
        `).order('registration_id', { ascending: true });
        
        if (!error && data) {
            registrations = data;
            renderRegistrations(registrations);
            loadOverview();
        }
    }

    function renderRegistrations(dataToRender) {
        const tbody = document.getElementById('registrationsTableBody');
        if (dataToRender.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No registrations found.</td></tr>';
            return;
        }
        tbody.innerHTML = dataToRender.map(r => {
            const dateStr = new Date(r.registration_date).toLocaleDateString();
            return `
            <tr>
                <td>${r.registration_id}</td>
                <td><span class="clickable-link" onclick="viewStudentCourses(${r.student_id}, '${(r.Student?.name || 'Unknown').replace(/'/g, "\\'")}')">${r.Student?.name || 'Unknown'}</span></td>
                <td><span class="clickable-link" onclick="viewCourseStudents(${r.course_id}, '${(r.Course?.course_name || 'Unknown').replace(/'/g, "\\'")}')">${r.Course?.course_name || 'Unknown'}</span></td>
                <td>${dateStr}</td>
                <td style="text-align: right;">
                    ${isAdmin ? `
                    <button class="action-btn delete" onclick="deleteRegistration(${r.registration_id})" title="Remove"><i class="fa-solid fa-trash"></i></button>
                    ` : '<span style="color: var(--text-muted); font-size: 0.85rem;">Read Only</span>'}
                </td>
            </tr>
        `}).join('');
    }

    // Populate Modal Dropdowns
    function populateDropdowns() {
        const studentSelect = document.getElementById('regStudentId');
        const courseSelect = document.getElementById('regCourseId');
        
        if(studentSelect) {
            studentSelect.innerHTML = '<option value="">Select a student...</option>' + 
                students.map(s => `<option value="${s.student_id}">${s.name}</option>`).join('');
        }
        if(courseSelect) {
            courseSelect.innerHTML = '<option value="">Select a course...</option>' + 
                courses.map(c => `<option value="${c.course_id}">${c.course_name}</option>`).join('');
        }
    }

    // Search Logic
    document.getElementById('searchStudent').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = students.filter(s => s.name.toLowerCase().includes(query) || s.email.toLowerCase().includes(query));
        renderStudents(filtered);
    });

    document.getElementById('searchCourse').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = courses.filter(c => c.course_name.toLowerCase().includes(query));
        renderCourses(filtered);
    });

    document.getElementById('searchRegistration').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = registrations.filter(r => 
            (r.Student?.name.toLowerCase().includes(query)) || 
            (r.Course?.course_name.toLowerCase().includes(query))
        );
        renderRegistrations(filtered);
    });


    // -------------------------------------------------------------------------
    // Modal Helpers
    // -------------------------------------------------------------------------
    window.closeModal = (modalId) => {
        document.getElementById(modalId).style.display = 'none';
        
        if (modalId === 'studentModal') document.getElementById('studentForm').reset();
        if (modalId === 'courseModal') document.getElementById('courseForm').reset();
        if (modalId === 'registrationModal') document.getElementById('registrationForm').reset();
    };

    window.viewStudentCourses = (studentId, studentName) => {
        document.getElementById('vscTitle').innerText = `${studentName}'s Courses`;
        const list = document.getElementById('vscList');
        const studentRegs = registrations.filter(r => r.student_id === studentId);
        
        if(studentRegs.length === 0) {
            list.innerHTML = '<li style="color: var(--text-muted);">Not registered in any courses yet.</li>';
        } else {
            list.innerHTML = studentRegs.map(r => `<li>
                <span>${r.Course?.course_name}</span>
                <span style="color: var(--text-muted); font-size: 0.85rem;">Registered: ${new Date(r.registration_date).toLocaleDateString()}</span>
            </li>`).join('');
        }
        document.getElementById('viewStudentCoursesModal').style.display = 'flex';
    };

    window.viewCourseStudents = (courseId, courseName) => {
        document.getElementById('vcsTitle').innerText = `Students in ${courseName}`;
        const list = document.getElementById('vcsList');
        const courseRegs = registrations.filter(r => r.course_id === courseId);
        
        if(courseRegs.length === 0) {
            list.innerHTML = '<li style="color: var(--text-muted);">No students registered yet.</li>';
        } else {
            list.innerHTML = courseRegs.map(r => `<li>
                <span>${r.Student?.name}</span>
                <span style="color: var(--text-muted); font-size: 0.85rem;">Registered: ${new Date(r.registration_date).toLocaleDateString()}</span>
            </li>`).join('');
        }
        document.getElementById('viewCourseStudentsModal').style.display = 'flex';
    };

    window.openStudentModal = () => {
        document.getElementById('studentForm').reset();
        document.getElementById('studentId').value = '';
        document.getElementById('studentModalTitle').innerText = 'Add New Student';
        document.getElementById('studentModal').style.display = 'flex';
    }

    window.openCourseModal = () => {
        document.getElementById('courseForm').reset();
        document.getElementById('courseId').value = '';
        document.getElementById('courseModalTitle').innerText = 'Add New Course';
        document.getElementById('courseModal').style.display = 'flex';
    }

    window.openRegistrationModal = () => {
        document.getElementById('registrationForm').reset();
        document.getElementById('registrationModal').style.display = 'flex';
    }

    // -------------------------------------------------------------------------
    // Student CRUD
    // -------------------------------------------------------------------------
    window.editStudent = (id) => {
        const student = students.find(s => s.student_id === id);
        if (!student) return;
        document.getElementById('studentModalTitle').innerText = 'Edit Student';
        document.getElementById('studentId').value = student.student_id;
        document.getElementById('studentName').value = student.name;
        document.getElementById('studentEmail').value = student.email;
        document.getElementById('studentPhone').value = student.phone || '';
        document.getElementById('studentModal').style.display = 'flex';
    };

    window.deleteStudent = async (id) => {
        if (!confirm("Delete this student? This will also remove their registrations.")) return;
        const { error } = await supabase.from('Student').delete().eq('student_id', id);
        if (!error) {
            await loadStudents();
            await loadRegistrations(); // Cascade delete impacts registrations
        }
    };

    document.getElementById('studentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('studentId').value;
        const payload = {
            name: document.getElementById('studentName').value,
            email: document.getElementById('studentEmail').value,
            phone: document.getElementById('studentPhone').value,
        };
        const btn = document.getElementById('studentSubmitBtn');
        btn.disabled = true; btn.innerText = 'Saving...';
        
        try {
            if (id) await supabase.from('Student').update(payload).eq('student_id', id);
            else await supabase.from('Student').insert([payload]);
            closeModal('studentModal');
            showToast(id ? "Student updated!" : "Student added!", "success");
            await loadStudents();
        } catch(err) { showToast(err.message, "error"); }
        btn.disabled = false; btn.innerText = 'Save';
    });

    // -------------------------------------------------------------------------
    // Course CRUD
    // -------------------------------------------------------------------------
    window.editCourse = (id) => {
        const course = courses.find(c => c.course_id === id);
        if (!course) return;
        document.getElementById('courseModalTitle').innerText = 'Edit Course';
        document.getElementById('courseId').value = course.course_id;
        document.getElementById('courseName').value = course.course_name;
        document.getElementById('courseCredits').value = course.credit_hours;
        document.getElementById('courseModal').style.display = 'flex';
    };

    window.deleteCourse = async (id) => {
        if (!confirm("Delete this course? This will also remove registrations for this course.")) return;
        const { error } = await supabase.from('Course').delete().eq('course_id', id);
        if (!error) {
            await loadCourses();
            await loadRegistrations();
        }
    };

    document.getElementById('courseForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('courseId').value;
        const payload = {
            course_name: document.getElementById('courseName').value,
            credit_hours: parseInt(document.getElementById('courseCredits').value)
        };
        const btn = document.getElementById('courseSubmitBtn');
        btn.disabled = true; btn.innerText = 'Saving...';
        
        try {
            if (id) await supabase.from('Course').update(payload).eq('course_id', id);
            else await supabase.from('Course').insert([payload]);
            closeModal('courseModal');
            showToast(id ? "Course updated!" : "Course added!", "success");
            await loadCourses();
        } catch(err) { showToast(err.message, "error"); }
        btn.disabled = false; btn.innerText = 'Save';
    });

    // -------------------------------------------------------------------------
    // Registration CRUD
    // -------------------------------------------------------------------------
    window.deleteRegistration = async (id) => {
        if (!confirm("Remove this registration?")) return;
        const { error } = await supabase.from('Registration').delete().eq('registration_id', id);
        if (!error) await loadRegistrations();
    };

    document.getElementById('registrationForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            student_id: parseInt(document.getElementById('regStudentId').value),
            course_id: parseInt(document.getElementById('regCourseId').value)
        };
        const btn = document.getElementById('regSubmitBtn');
        btn.disabled = true; btn.innerText = 'Registering...';
        
        try {
            const { error } = await supabase.from('Registration').insert([payload]);
            if(error) throw error;
            closeModal('registrationModal');
            showToast("Student registered successfully!", "success");
            await loadRegistrations();
        } catch(err) { showToast(err.message, "error"); }
        btn.disabled = false; btn.innerText = 'Register';
    });

    // -------------------------------------------------------------------------
    // Initial Load
    // -------------------------------------------------------------------------
    await Promise.all([loadStudents(), loadCourses(), loadRegistrations()]);
});
