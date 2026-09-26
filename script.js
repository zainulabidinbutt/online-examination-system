const KEY={users:"exam_users",current:"exam_current",questions:"exam_questions",results:"exam_results"};
const seedQuestions=[
{id:"q1",category:"HTML",question:"Which HTML tag is used to create a hyperlink?",options:["<link>","<a>","<href>","<url>"],answer:1},
{id:"q2",category:"CSS",question:"Which CSS property changes the text color?",options:["font-style","background","color","text-decoration"],answer:2},
{id:"q3",category:"JavaScript",question:"Which keyword declares a block-scoped variable that can be reassigned?",options:["const","let","static","define"],answer:1},
{id:"q4",category:"JavaScript",question:"Which method converts a JSON string into a JavaScript object?",options:["JSON.parse()","JSON.stringify()","JSON.object()","JSON.convert()"],answer:0},
{id:"q5",category:"HTML",question:"Which attribute provides alternative text for an image?",options:["src","title","alt","href"],answer:2},
{id:"q6",category:"CSS",question:"Which CSS layout system is commonly used for one-dimensional row/column layouts?",options:["Flexbox","Floatbox","TableScript","Canvas"],answer:0},
{id:"q7",category:"JavaScript",question:"Which symbol starts a single-line JavaScript comment?",options:["<!--","//","##","**"],answer:1},
{id:"q8",category:"General",question:"What does CPU stand for?",options:["Central Process Utility","Computer Personal Unit","Central Processing Unit","Core Program User"],answer:2}
];
let questions=get(KEY.questions,seedQuestions), users=get(KEY.users,[]), results=get(KEY.results,[]);
if(!localStorage.getItem(KEY.questions)) save(KEY.questions,questions);
let current=get(KEY.current,null), quiz=null, timer=null;

function get(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}}
function save(k,v){localStorage.setItem(k,JSON.stringify(v))}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function toast(msg){const x=document.createElement("div");x.className="toast";x.textContent=msg;document.body.appendChild(x);setTimeout(()=>x.remove(),2500)}
function initials(n){return (n||"U").split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase()}
function logout(){localStorage.removeItem(KEY.current);current=null;renderAuth("login")}

function renderAuth(mode="login"){
document.getElementById("app").innerHTML=`<div class="auth"><div class="auth-card">
<div class="logo-big">ExamPro</div><h2>${mode==="login"?"Welcome back":"Create account"}</h2>
<p class="sub">${mode==="login"?"Login to continue your examination.":"Register as a student to start exams."}</p>
<form id="authForm">
${mode==="register"?`<div class="field"><label>Full name</label><input id="name" required placeholder="Enter your name"></div>`:""}
<div class="field"><label>Email</label><input id="email" type="email" required placeholder="student@example.com"></div>
<div class="field"><label>Password</label><input id="password" type="password" required minlength="4" placeholder="Minimum 4 characters"></div>
<button class="btn btn-primary full">${mode==="login"?"Login":"Register"}</button></form>
<div class="switch">${mode==="login"?"Don't have an account?":"Already have an account?"} <span class="link" id="switch">${mode==="login"?"Register":"Login"}</span></div>
<div class="switch"><span class="link" id="adminDemo">Admin demo</span></div>
</div></div>`;
document.getElementById("switch").onclick=()=>renderAuth(mode==="login"?"register":"login");
document.getElementById("adminDemo").onclick=()=>adminLogin();
document.getElementById("authForm").onsubmit=e=>{
e.preventDefault();const email=document.getElementById("email").value.trim().toLowerCase(),pass=document.getElementById("password").value;
if(mode==="register"){const name=document.getElementById("name").value.trim();if(users.some(u=>u.email===email))return toast("Email already registered");const u={id:Date.now().toString(),name,email,password:pass};users.push(u);save(KEY.users,users);save(KEY.current,u);current=u;renderStudent();toast("Account created")}
else{const u=users.find(x=>x.email===email&&x.password===pass);if(!u)return toast("Invalid email or password");save(KEY.current,u);current=u;renderStudent()}
}}
function adminLogin(){current={id:"admin",name:"Administrator",role:"admin"};renderAdmin()}

function topbar(name,admin=false){return `<div class="topbar"><div class="brand">Exam<span>Pro</span></div><div class="user-area"><div class="avatar">${initials(name)}</div><strong>${esc(name)}</strong><button class="btn btn-light btn-sm" onclick="${admin?"logoutAdmin()":"logout()"}">Logout</button></div></div>`}

function renderStudent(){
if(!current){return renderAuth("login")}
document.getElementById("app").innerHTML=topbar(current.name)+`<main class="container">
<section class="hero"><h1>Welcome, ${esc(current.name.split(" ")[0])} </h1><p>Choose an exam category, test your knowledge, and track your results.</p></section>
<div class="stats">
<div class="stat"><div class="muted">Available Exams</div><div class="num">${new Set(questions.map(q=>q.category)).size}</div></div>
<div class="stat"><div class="muted">Questions</div><div class="num">${questions.length}</div></div>
<div class="stat"><div class="muted">Attempts</div><div class="num">${results.filter(r=>r.userId===current.id).length}</div></div>
<div class="stat"><div class="muted">Best Score</div><div class="num">${bestScore()}%</div></div>
</div>
<div class="section-head"><h2>Exam Categories</h2></div><div id="categories" class="grid"></div>
<div class="section-head"><h2>Result History</h2></div><div class="card" id="history"></div>
</main>`;
renderCategories();renderHistory();
}
function bestScore(){const r=results.filter(x=>x.userId===current.id);return r.length?Math.max(...r.map(x=>x.percent)):0}
function renderCategories(){
const cats=[...new Set(questions.map(q=>q.category))];const el=document.getElementById("categories");
el.innerHTML=cats.map(c=>{const n=questions.filter(q=>q.category===c).length;return `<div class="card exam-card"><span class="tag">${esc(c)}</span><h3>${esc(c)} Examination</h3><p>Test yourself with ${n} multiple-choice question${n!==1?"s":""}.</p><div class="exam-meta"><span>📝 ${n} questions</span><span>⏱ ${Math.max(1,Math.ceil(n*0.5))} min</span></div><button class="btn btn-primary" onclick="startExam('${esc(c)}')">Start Exam</button></div>`}).join("")||`<div class="empty">No exams available.</div>`;
}
function renderHistory(){
const mine=results.filter(r=>r.userId===current.id).sort((a,b)=>b.date-a.date),el=document.getElementById("history");
el.innerHTML=mine.length?mine.map(r=>`<div class="history-item"><div><strong>${esc(r.category)}</strong><div class="muted">${new Date(r.date).toLocaleString()} · ${r.score}/${r.total} correct</div></div><span class="tag">${r.percent}%</span></div>`).join(""):`<div class="empty">No results yet. Complete an exam to see your history.</div>`;
}

function startExam(category){
const qs=questions.filter(q=>q.category===category);quiz={category,qs:qs.sort(()=>Math.random()-.5),index:0,answers:Array(qs.length).fill(null),seconds:Math.max(60,qs.length*30)};
renderQuiz();timer=setInterval(()=>{quiz.seconds--;renderTimer();if(quiz.seconds<=0)finishExam()},1000);
}
function renderTimer(){const t=document.getElementById("timer");if(t){t.textContent=`${String(Math.floor(quiz.seconds/60)).padStart(2,"0")}:${String(quiz.seconds%60).padStart(2,"0")}`;t.classList.toggle("danger",quiz.seconds<=30)}}
function renderQuiz(){
const q=quiz.qs[quiz.index],pct=((quiz.index+1)/quiz.qs.length)*100;
document.getElementById("app").innerHTML=`${topbar(current.name)}<div class="quiz-wrap"><div class="quiz-head"><div><strong>${esc(quiz.category)} Exam</strong><div class="muted">Question ${quiz.index+1} of ${quiz.qs.length}</div></div><div id="timer" class="timer"></div></div>
<div class="progress"><div style="width:${pct}%"></div></div><div class="question-card"><h2>${esc(q.question)}</h2><div class="options">${q.options.map((o,i)=>`<button class="option ${quiz.answers[quiz.index]===i?"selected":""}" onclick="choose(${i})">${String.fromCharCode(65+i)}. ${esc(o)}</button>`).join("")}</div>
<div class="quiz-actions"><button class="btn btn-light" onclick="prevQ()" ${quiz.index===0?"disabled":""}>← Previous</button>${quiz.index===quiz.qs.length-1?`<button class="btn btn-success" onclick="finishExam()">Submit Exam</button>`:`<button class="btn btn-primary" onclick="nextQ()">Next →</button>`}</div></div></div>`;
renderTimer();
}
function choose(i){quiz.answers[quiz.index]=i;renderQuiz()}
function nextQ(){if(quiz.index<quiz.qs.length-1){quiz.index++;renderQuiz()}}
function prevQ(){if(quiz.index>0){quiz.index--;renderQuiz()}}
function finishExam(){
if(!quiz)return;clearInterval(timer);timer=null;
const score=quiz.qs.reduce((n,q,i)=>n+(quiz.answers[i]===q.answer?1:0),0),percent=Math.round(score/quiz.qs.length*100);
results.push({id:Date.now().toString(),userId:current.id,category:quiz.category,score,total:quiz.qs.length,percent,date:Date.now()});save(KEY.results,results);
renderResult(score,quiz.qs.length,percent);quiz=null;
}
function renderResult(score,total,percent){
document.getElementById("app").innerHTML=`${topbar(current.name)}<main class="container"><div class="card result"><div class="tag">Exam Completed</div><h1>Your Result</h1><div class="score">${percent}%</div><p class="muted">You answered ${score} out of ${total} questions correctly.</p><div class="result-box"><div class="result-stat"><strong>${score}</strong><div class="muted">Correct</div></div><div class="result-stat"><strong>${total-score}</strong><div class="muted">Wrong</div></div><div class="result-stat"><strong>${total}</strong><div class="muted">Total</div></div></div><button class="btn btn-primary" onclick="renderStudent()">Back to Dashboard</button></div></main>`;
}

function renderAdmin(){
document.getElementById("app").innerHTML=`${topbar("Administrator",true)}<div class="layout"><aside class="sidebar"><div class="side-title">Management</div><button class="nav-btn active" onclick="adminSection('dashboard',this)">Dashboard</button><button class="nav-btn" onclick="adminSection('questions',this)">Question CRUD</button><button class="nav-btn" onclick="adminSection('results',this)">Results</button><button class="nav-btn" onclick="adminSection('students',this)">Students</button></aside><section class="admin-main" id="adminContent"></section></div>`;
adminSection("dashboard");
}
function logoutAdmin(){current=null;renderAuth("login")}
function adminSection(section,btn){
document.querySelectorAll(".nav-btn").forEach(x=>x.classList.remove("active"));if(btn)btn.classList.add("active");const el=document.getElementById("adminContent");
if(section==="dashboard")el.innerHTML=`<h1>Admin Dashboard</h1><p class="muted">Manage your online examination platform.</p><div class="stats" style="margin-top:22px"><div class="stat"><div class="muted">Questions</div><div class="num">${questions.length}</div></div><div class="stat"><div class="muted">Categories</div><div class="num">${new Set(questions.map(q=>q.category)).size}</div></div><div class="stat"><div class="muted">Students</div><div class="num">${users.length}</div></div><div class="stat"><div class="muted">Attempts</div><div class="num">${results.length}</div></div></div>`;
if(section==="questions")renderQuestionAdmin(el);
if(section==="results")renderResultsAdmin(el);
if(section==="students")renderStudentsAdmin(el);
}
function renderQuestionAdmin(el){
el.innerHTML=`<div class="section-head"><div><h1>Question CRUD</h1><p class="muted">Create, read, update and delete MCQ questions.</p></div><button class="btn btn-primary" onclick="openQuestionModal()">+ Add Question</button></div><div class="card table-wrap"><table class="table"><thead><tr><th>Category</th><th>Question</th><th>Options</th><th>Answer</th><th>Actions</th></tr></thead><tbody>${questions.map(q=>`<tr><td><span class="tag">${esc(q.category)}</span></td><td>${esc(q.question)}</td><td>${q.options.length}</td><td>${esc(q.options[q.answer])}</td><td><div class="actions"><button class="btn btn-light btn-sm" onclick="openQuestionModal('${q.id}')">Edit</button><button class="btn btn-danger btn-sm" onclick="deleteQuestion('${q.id}')">Delete</button></div></td></tr>`).join("")}</tbody></table></div>`;
}
function openQuestionModal(id){
const q=questions.find(x=>x.id===id)||{category:"General",question:"",options:["","","",""],answer:0};
const editing=!!id;
const modal=document.createElement("div");modal.className="modal";modal.id="qModal";
modal.innerHTML=`<div class="modal-box"><div class="modal-head"><h2>${editing?"Edit":"Add"} Question</h2><button class="close" onclick="document.getElementById('qModal').remove()">×</button></div>
<form id="qForm"><div class="field"><label>Category</label><input id="qCat" required value="${esc(q.category)}"></div><div class="field"><label>Question</label><textarea id="qText" rows="3" required>${esc(q.question)}</textarea></div>
${q.options.map((o,i)=>`<div class="field"><label>Option ${String.fromCharCode(65+i)}</label><input id="opt${i}" required value="${esc(o)}"></div>`).join("")}
<div class="field"><label>Correct option</label><select id="qAns">${q.options.map((o,i)=>`<option value="${i}" ${q.answer===i?"selected":""}>Option ${String.fromCharCode(65+i)}</option>`).join("")}</select></div>
<button class="btn btn-primary full">${editing?"Update":"Create"} Question</button></form></div>`;
document.body.appendChild(modal);document.getElementById("qForm").onsubmit=e=>{
e.preventDefault();const obj={id:id||"q"+Date.now(),category:document.getElementById("qCat").value.trim(),question:document.getElementById("qText").value.trim(),options:[0,1,2,3].map(i=>document.getElementById("opt"+i).value.trim()),answer:+document.getElementById("qAns").value};
if(editing)questions=questions.map(x=>x.id===id?obj:x);else questions.push(obj);save(KEY.questions,questions);modal.remove();adminSection("questions");toast(editing?"Question updated":"Question created");
};
}
function deleteQuestion(id){if(confirm("Delete this question?")){questions=questions.filter(q=>q.id!==id);save(KEY.questions,questions);adminSection("questions");toast("Question deleted")}}
function renderResultsAdmin(el){el.innerHTML=`<div class="section-head"><div><h1>All Results</h1><p class="muted">Review student examination history.</p></div></div><div class="card table-wrap"><table class="table"><thead><tr><th>Student</th><th>Category</th><th>Score</th><th>Percentage</th><th>Date</th></tr></thead><tbody>${results.length?results.slice().sort((a,b)=>b.date-a.date).map(r=>{const u=users.find(x=>x.id===r.userId);return `<tr><td>${esc(u?.name||"Unknown")}</td><td>${esc(r.category)}</td><td>${r.score}/${r.total}</td><td><span class="tag">${r.percent}%</span></td><td>${new Date(r.date).toLocaleString()}</td></tr>`}).join(""):`<tr><td colspan="5" class="empty">No exam attempts yet.</td></tr>`}</tbody></table></div>`}
function renderStudentsAdmin(el){el.innerHTML=`<div class="section-head"><div><h1>Students</h1><p class="muted">Registered student accounts.</p></div></div><div class="card table-wrap"><table class="table"><thead><tr><th>Name</th><th>Email</th><th>Attempts</th></tr></thead><tbody>${users.length?users.map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${results.filter(r=>r.userId===u.id).length}</td></tr>`).join(""):`<tr><td colspan="3" class="empty">No students registered.</td></tr>`}</tbody></table></div>`}

if(current){if(current.role==="admin")renderAdmin();else renderStudent()}else renderAuth("login");
