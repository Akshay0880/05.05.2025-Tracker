import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, doc, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyBNkanHKbhyE5eixsnG7-W1Ym-cVZmfLOc",
  authDomain: "assignment-tracker-1e20e.firebaseapp.com",
  projectId: "assignment-tracker-1e20e",
  storageBucket: "assignment-tracker-1e20e.appspot.com",
  messagingSenderId: "723324575217",
  appId: "1:723324575217:web:4187d2e1ef205133e5b850",
  measurementId: "G-8505T7C9JX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userEmail = document.getElementById("userEmail");
const assignmentForm = document.getElementById("assignmentForm");
const assignmentList = document.getElementById("assignmentList");
const toggleSidebar = document.getElementById("toggleSidebar");
const sidebar = document.getElementById("sidebar");

// Sidebar toggle functionality
toggleSidebar.addEventListener("click", () => {
  sidebar.classList.toggle("active");
});

// Login with Google
loginBtn.addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    console.log("Login successful:", result.user);
    updateUserInfo(result.user);
  } catch (error) {
    console.error("Login error:", error);
    alert(`Login failed: ${error.message}`);
  }
});

// Logout
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    userEmail.textContent = "Not logged in";
    assignmentList.innerHTML = '<p>Please login to view assignments.</p>';
    resetSidebarInfo();
  } catch (error) {
    console.error("Logout error:", error);
  }
});

// Add new assignment
assignmentForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return alert("Please login first!");

  try {
    await addDoc(collection(db, "assignments"), {
      title: document.getElementById("title").value,
      subject: document.getElementById("subject").value,
      dueDate: document.getElementById("dueDate").value,
      completed: false,
      userId: user.uid
    });

    window.emailjs.send("service_82ldoxm", "template_udykj4k", {
  title: document.getElementById("title").value,
  subject: document.getElementById("subject").value,
  due_date: document.getElementById("dueDate").value,
  user_email: user.email
}).then(() => {
  console.log("Email reminder sent successfully.");
}).catch((error) => {
  console.error("Failed to send email reminder:", error);
});


    assignmentForm.reset();
    fetchAssignments();
  } catch (error) {
    console.error("Error adding assignment:", error);
  }
});

// Fetch assignments from Firestore
const fetchAssignments = async () => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const assignmentsQuery = query(
      collection(db, "assignments"), 
      orderBy("dueDate")
    );
    const querySnapshot = await getDocs(assignmentsQuery);
    assignmentList.innerHTML = "";

    let assignmentCount = 0;
    querySnapshot.forEach((doc) => {
      const assignment = doc.data();
      if (assignment.userId === user.uid) {
        assignmentCount++;
        const assignmentItem = document.createElement("div");
        assignmentItem.className = "assignment-item";
        assignmentItem.dataset.id = doc.id;
        
        assignmentItem.innerHTML = `
          <div class="assignment-info">
            <h3>${assignment.title}</h3>
            <p>Subject: ${assignment.subject}</p>
            <p>Due: ${new Date(assignment.dueDate).toLocaleDateString()}</p>
            <p>Status: ${assignment.completed ? '✅ Completed' : '🟡 Pending'}</p>
          </div>
          <button class="delete-btn">Delete</button>
        `;
        
        const deleteBtn = assignmentItem.querySelector(".delete-btn");
        deleteBtn.addEventListener("click", async () => {
          try {
            await deleteAssignment(doc.id);
            assignmentItem.remove();
            document.getElementById("sidebarAssignments").textContent = assignmentCount - 1;
          } catch (error) {
            console.error("Error deleting assignment:", error);
          }
        });
        
        assignmentList.appendChild(assignmentItem);
      }
    });

    document.getElementById("sidebarAssignments").textContent = assignmentCount;
  } catch (error) {
    console.error("Error fetching assignments:", error);
  }
};

// Delete assignment function
const deleteAssignment = async (assignmentId) => {
  try {
    await deleteDoc(doc(db, "assignments", assignmentId));
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
};

// Update user info in sidebar
const updateUserInfo = (user) => {
  userEmail.textContent = `Logged in as: ${user.email}`;
  document.getElementById("sidebarName").textContent = user.displayName || "Unknown";
  document.getElementById("sidebarEmail").textContent = user.email;
  document.getElementById("sidebarLogin").textContent = new Date().toLocaleString();
  fetchAssignments();
};

// Reset sidebar info
const resetSidebarInfo = () => {
  document.getElementById("sidebarName").textContent = "John Doe";
  document.getElementById("sidebarEmail").textContent = "john@example.com";
  document.getElementById("sidebarAssignments").textContent = "0";
  document.getElementById("sidebarLogin").textContent = "N/A";
};

// Auth state listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    updateUserInfo(user);
  } else {
    userEmail.textContent = "Not logged in";
    assignmentList.innerHTML = '<p>Please login to view assignments.</p>';
    resetSidebarInfo();
  }
});