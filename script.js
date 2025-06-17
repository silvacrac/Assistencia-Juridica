document.addEventListener('DOMContentLoaded', () => {
    let usersDB = {
        'joana.filipe@email.com': { name: "Joana Filipe", password: "123", type: "Utente", role: 'utente', bio: "Procuro ajuda na área de Registo e Notariado." },
        'alberto.mota@email.com': { name: "Alberto Mota", password: "123", type: "Utente", role: 'utente', bio: "Utente do IPAJ." },
        'mateus.afonso@ipaj.co.mz': { name: "Dr. Mateus Afonso", password: "123", type: "Advogado", role: 'advogado', bio: "Especialista em Direito de Terras e Contencioso." },
        'ana.clara@ipaj.co.mz': { name: "Dr.ª Ana Clara", password: "123", type: "Advogado", role: 'advogado', bio: "Especialista em Direito da Família." },
        'admin@ipaj.co.mz': { name: "Admin IPAJ", password: "123", type: "Administrador", role: 'admin', bio: "Gestor da plataforma IPAJ-Connect." }
    };
    let casesDB = [{ id: 1, utente: "Alberto Mota", area: "Direito do Trabalho", date: "2024-05-19", status: "Pendente", assignedTo: null, description: "Fui despedido sem justa causa.", documents: [] },{ id: 2, utente: "Joana Filipe", area: "Registo e Notariado", date: "2024-05-18", status: "Aceite", assignedTo: "Dr.ª Ana Clara", description: "Preciso de ajuda com o registo de um imóvel.", documents: [{name: 'contrato_promessa.pdf', size: '1.2MB'}] }];
    let denunciasDB = [{ id: 1, caseId: 2, utenteName: "Joana Filipe", lawyerName: "Dr.ª Ana Clara", reason: "O advogado não responde.", status: "Pendente" }];
    let chatsDB = { "chat_case_2": [{ sender: "Dr.ª Ana Clara", text: "Boa tarde Sra. Joana." },{ sender: "Joana Filipe", text: "Boa tarde Dr.ª." }, { type: 'file', sender: "Dr.ª Ana Clara", file: { name: 'contrato_promessa.pdf', size: '1.2MB' } }] };
    let postsDB = [{ id: 1, author: "Dr. Mateus Afonso", role: "Advogado", text: "O direito à terra (DUAT) é um pilar fundamental em Moçambique.", image: "", timestamp: "Há 3 horas" }];
    let notificationsDB = [{ id: 1, text: "Bem-vindo ao IPAJ-Connect!", read: true, forRole: ['utente', 'advogado', 'admin'] }];
    
    let lawyers = Object.values(usersDB).filter(u => u.role === 'advogado').map(u => u.name);
    let activeChatId = null;
    let currentUser = null;
    
    const appContainer = document.getElementById('app-container');
    const roleSelector = document.getElementById('role-selector');
    
    function initAuth() {
        const loginForm = document.getElementById('login-form');
        loginForm.addEventListener('submit', (e) => { 
            e.preventDefault();
            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;
            const user = usersDB[email];
            if (user && user.password === password) {
                currentUser = user;
                document.getElementById('login-screen').style.display = 'none';
                appContainer.style.display = 'flex';
                roleSelector.value = currentUser.role;
                updateUIForRole(currentUser.role);
            } else {
                alert('Email ou senha inválidos.');
            }
        });
        document.getElementById('show-signup').addEventListener('click', (e) => { e.preventDefault(); document.getElementById('login-screen').style.display = 'none'; document.getElementById('signup-screen').style.display = 'flex'; });
        document.getElementById('show-login').addEventListener('click', (e) => { e.preventDefault(); document.getElementById('signup-screen').style.display = 'none'; document.getElementById('login-screen').style.display = 'flex'; });
    }

    function initThemeSwitcher() {
        const themeSwitcher = document.querySelector('.theme-switcher');
        if (localStorage.getItem('theme') === 'dark') { document.body.classList.add('dark-mode'); themeSwitcher.querySelector('i').classList.replace('fa-moon', 'fa-sun'); }
        themeSwitcher.addEventListener('click', () => { document.body.classList.toggle('dark-mode'); const isDark = document.body.classList.contains('dark-mode'); themeSwitcher.querySelector('i').classList.toggle('fa-sun', isDark); themeSwitcher.querySelector('i').classList.toggle('fa-moon', !isDark); localStorage.setItem('theme', isDark ? 'dark' : 'light'); });
    }

    function switchView(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active-view'));
        document.getElementById(viewId).classList.add('active-view');
        document.querySelectorAll('.main-nav li, #mobile-nav a').forEach(link => { link.classList.remove('active'); if (link.dataset.view === viewId.replace('-view', '')) link.classList.add('active'); });
        if (viewId === 'feed-view') renderFeed();
        if (viewId === 'chat-view') { renderChatList(); document.getElementById('chat-welcome-screen').style.display = 'flex'; document.getElementById('chat-conversation-area').style.display = 'none'; }
    }
    
    function initNavigation() {
        document.querySelectorAll('.main-nav li, #mobile-nav a').forEach(link => { link.addEventListener('click', (e) => { e.preventDefault(); if(link.dataset.view) switchView(`${link.dataset.view}-view`); }); });
        roleSelector.addEventListener('change', (e) => { const role = e.target.value; const userEmail = Object.keys(usersDB).find(k => usersDB[k].role === role); currentUser = usersDB[userEmail]; updateUIForRole(role); });
    }
    
    function updateUIForRole(role) {
        document.getElementById('sidebar-username').textContent = currentUser.name;
        document.getElementById('sidebar-usertype').textContent = currentUser.type;
        document.getElementById('profile-main-name').textContent = currentUser.name;
        document.getElementById('profile-main-bio').textContent = currentUser.bio;
        document.getElementById('btn-solicitar-assistencia').style.display = role === 'utente' ? 'flex' : 'none';
        document.getElementById('create-post-section').style.display = role === 'advogado' ? 'block' : 'none';
        document.getElementById('admin-nav-link').style.display = role === 'admin' ? 'flex' : 'none';
        document.getElementById('right-sidebar').style.display = role === 'utente' ? 'block' : 'none';
        if (role === 'admin') { switchView('admin-view'); renderAdminPanels(); }
        else { switchView('feed-view'); if (role === 'advogado') renderLawyerSections(); if(role === 'utente') renderUtenteCases(); }
        renderNotifications();
    }

    function renderFeed() { const container = document.getElementById('feed-posts-container'); container.innerHTML = postsDB.map(p => ` <div class="post-card"><div class="post-header"><div class="avatar-icon-wrapper"><i class="fa-solid fa-user-circle"></i></div><div><h4>${p.author}</h4><p>${p.role} • ${p.timestamp}</p></div></div><div class="post-body"><p>${p.text}</p>${p.image ? `<img src="${p.image}" alt="Publicação">` : ''}</div><div class="post-actions"><span><i class="fa-regular fa-heart"></i> Reagir</span><span><i class="fa-regular fa-comment"></i> Comentar</span></div></div> `).join(''); }
    function renderUtenteCases() { const list = document.getElementById('utente-cases-list'); const myCases = casesDB.filter(c => c.utente === currentUser.name); list.innerHTML = myCases.length > 0 ? myCases.map(c => `<li data-case-id="${c.id}"><a href="#"><strong>Caso #${c.id}</strong> - ${c.area}<br><small>Status: ${c.status}</small></a></li>`).join('') : '<li>Nenhum caso registado.</li>'; }
    function renderAdminPanels() { const colCount = s => document.querySelector(`${s} th`).parentElement.childElementCount; const render = (s, d, rt) => { const t = document.querySelector(`${s} tbody`); t.innerHTML = d.length > 0 ? d.map(i => `<tr data-case-id="${i.id}">${rt(i)}</tr>`).join('') : `<tr><td colspan="${colCount(s)}">Nenhum registo.</td></tr>`; }; render('#pending-requests-table', casesDB.filter(c => c.status === 'Pendente'), c => `<td>${c.utente}</td><td>${c.area}</td><td>${c.date}</td><td><select>${lawyers.map(l=>`<option>${l}</option>`).join('')}</select><button class="btn-action btn-assign">Atribuir</button></td>`); render('#denuncias-table', denunciasDB, d => `<td>${d.utenteName}</td><td>${d.lawyerName}</td><td>${d.reason}</td><td><span class="status-${d.status.toLowerCase().replace(/\s/g, '-')}">${d.status}</span></td>`); }
    function renderLawyerSections() { const container = document.getElementById('lawyer-sections-container'); let html = ''; const assigned = casesDB.filter(c => c.status === 'Atribuído' && c.assignedTo === currentUser.name); const accepted = casesDB.filter(c => c.status === 'Aceite' && c.assignedTo === currentUser.name); if(assigned.length > 0) { html += `<div class="admin-section"><h3>Novas Atribuições</h3>${assigned.map(c => `<div class="assignment-card" data-case-id="${c.id}"><h4>Novo Caso: Utente ${c.utente}</h4><p>${c.area}</p><div class="assignment-actions"><button class="btn-action btn-accept">Aceitar</button></div></div>`).join('')}</div>`; } if(accepted.length > 0) { html += `<div class="admin-section"><h3>Meus Casos Aceites</h3><ul class="context-box">${accepted.map(c => `<li data-case-id="${c.id}"><a href="#"><strong>Caso #${c.id}</strong> - ${c.utente}</a></li>`).join('')}</ul></div>`; } container.innerHTML = html; }
    
    function renderCaseDetails(caseId) {
        const c = casesDB.find(c => c.id === caseId);
        if (!c) return;
        document.getElementById('case-details-title').textContent = `Detalhes do Caso #${c.id}`;
        document.getElementById('case-details-utente').textContent = c.utente;
        document.getElementById('case-details-lawyer').textContent = c.assignedTo || 'N/A';
        document.getElementById('case-details-area').textContent = c.area;
        document.getElementById('case-details-status').textContent = c.status;
        document.getElementById('case-details-description').textContent = c.description;
        const docsContainer = document.getElementById('case-details-docs');
        docsContainer.innerHTML = c.documents.length > 0 ? c.documents.map(d => `<div class="doc-item"><i class="fa-solid fa-file-pdf"></i><span>${d.name} (${d.size})</span></div>`).join('') : '<p>Nenhum documento neste caso.</p>';
        switchView('case-details-view');
    }
    
    function renderChatList() { const list = document.getElementById('chat-list'); let convos = []; const name = currentUser.name; if (currentUser.role === 'utente') { const myCase = casesDB.find(c => c.utente === name && c.status === 'Aceite'); if (myCase) convos.push({ id: `chat_case_${myCase.id}`, name: myCase.assignedTo, role: 'Advogado' }); } else if (currentUser.role === 'advogado') { casesDB.filter(c => c.assignedTo === name && c.status === 'Aceite').forEach(c => convos.push({ id: `chat_case_${c.id}`, name: c.utente, role: `Utente (Caso #${c.id})` })); convos.push({ id: `chat_admin_${name.replace(/[\s.ª]/g, '')}`, name: 'Admin IPAJ', role: 'Administração' }); } else if (currentUser.role === 'admin') { lawyers.forEach(l => convos.push({ id: `chat_admin_${l.replace(/[\s.ª]/g, '')}`, name: l, role: 'Advogado' })); } list.innerHTML = convos.length > 0 ? convos.map(c => `<div class="chat-list-item" data-chat-id="${c.id}"><div class="avatar-icon-wrapper"><i class="fa-solid fa-user-circle"></i></div><div class="chat-list-item-info"><strong>${c.name}</strong><p>${c.role}</p></div></div>`).join('') : '<p>Nenhuma conversa.</p>'; }
    function loadChat(chatId) { activeChatId = chatId; if (!chatsDB[chatId]) chatsDB[chatId] = []; document.querySelectorAll('.chat-list-item').forEach(i => i.classList.toggle('active', i.dataset.chatId === chatId)); document.getElementById('chat-welcome-screen').style.display = 'none'; document.getElementById('chat-conversation-area').style.display = 'flex'; const messages = chatsDB[chatId]; const chatMessages = document.querySelector('.chat-messages'); chatMessages.innerHTML = messages.map(msg => { const senderClass = msg.sender === currentUser.name ? 'message-sent' : 'message-received'; if (msg.type === 'file') { return `<div class="message ${senderClass}"><i class="fa-solid fa-file-zipper"></i><div class="message-file-info"><span>${msg.file.name}</span><small>${msg.file.size}</small></div></div>`; } return `<div class="message ${senderClass}"><p>${msg.text}</p></div>`; }).join(''); chatMessages.scrollTop = chatMessages.scrollHeight; const partner = document.querySelector(`.chat-list-item[data-chat-id='${chatId}']`); document.getElementById('chat-with-name').textContent = partner.querySelector('strong').textContent; document.getElementById('chat-with-role').textContent = partner.querySelector('p').textContent; const denounceBtn = document.getElementById('denounce-lawyer-btn'); if (currentUser.role === 'utente' && chatId.startsWith('chat_case_')) { denounceBtn.style.display = 'block'; denounceBtn.dataset.caseId = chatId.replace('chat_case_',''); } else { denounceBtn.style.display = 'none'; } }
    
    function addNotification(text, roles) { notificationsDB.unshift({ id: Date.now(), text, read: false, forRole: roles }); renderNotifications(); }
    function renderNotifications() { const list = document.getElementById('notification-list'); const userNotifs = notificationsDB.filter(n => n.forRole.includes(currentUser.role)); list.innerHTML = userNotifs.length > 0 ? userNotifs.map(n => `<div class="notification-item ${n.read ? '' : 'unread'}"><p>${n.text}</p></div>`).join('') : '<p class="empty-notification">Nenhuma notificação.</p>'; document.querySelector('.notification-dot').style.display = userNotifs.some(n => !n.read) ? 'block' : 'none'; }

    function initModals() {
        document.getElementById('btn-solicitar-assistencia').addEventListener('click', () => document.getElementById('assistencia-modal').style.display = 'block');
        document.querySelector('.mobile-assistencia-btn').addEventListener('click', () => document.getElementById('assistencia-modal').style.display = 'block');
        document.querySelectorAll('.modal').forEach(modal => { modal.querySelector('.close-modal').addEventListener('click', () => modal.style.display = 'none'); window.addEventListener('click', e => { if (e.target == modal) modal.style.display = 'none'; }); });
        document.getElementById('assistencia-form').addEventListener('submit', e => { e.preventDefault(); casesDB.push({ id: Date.now(), utente: currentUser.name, area: e.target.querySelector('#area-direito').value, description: e.target.querySelector('#descricao-caso').value, date: new Date().toISOString().split('T')[0], status: 'Pendente', documents: [] }); addNotification('Nova solicitação recebida.', ['admin']); alert('Solicitação enviada!'); e.target.closest('.modal').style.display = 'none'; updateUIForRole(currentUser.role); });
        document.getElementById('denuncia-form').addEventListener('submit', e => { e.preventDefault(); const caseId = parseInt(e.target.querySelector('#denuncia-case-id').value); const c = casesDB.find(c => c.id === caseId); if(c){ denunciasDB.push({ id: Date.now(), caseId, utenteName: c.utente, lawyerName: c.assignedTo, reason: e.target.querySelector('#denuncia-reason').value, status: 'Pendente' }); } addNotification(`Nova denúncia contra ${c.assignedTo}.`, ['admin']); alert('Denúncia enviada.'); e.target.closest('.modal').style.display = 'none'; updateUIForRole(currentUser.role); });
    }

    function initActionHandlers() {
        document.getElementById('main-content').addEventListener('click', e => {
            const caseTarget = e.target.closest('[data-case-id]');
            if (caseTarget) {
                const caseId = parseInt(caseTarget.dataset.caseId);
                const aCase = casesDB.find(c => c.id === caseId);
                if (e.target.matches('.btn-assign')) { aCase.status = 'Atribuído'; aCase.assignedTo = caseTarget.querySelector('select').value; addNotification(`O seu caso #${aCase.id} foi atribuído.`, ['utente']); addNotification(`Foi-lhe atribuído o caso #${aCase.id}.`, ['advogado']); renderAdminPanels(); }
                if (e.target.matches('.btn-accept')) { aCase.status = 'Aceite'; addNotification(`O seu caso #${aCase.id} foi aceite.`, ['utente']); const utenteUser = Object.values(usersDB).find(u => u.name === aCase.utente); if(utenteUser) addNotification(`O seu caso com ${aCase.utente} foi aceite. Pode iniciar a conversa.`, ['advogado']); renderLawyerSections(); }
                if (e.target.matches('a') || e.target.closest('a')) { e.preventDefault(); renderCaseDetails(caseId); }
            }
        });
        document.getElementById('right-sidebar').addEventListener('click', e => { const caseLink = e.target.closest('li[data-case-id]'); if(caseLink) renderCaseDetails(parseInt(caseLink.dataset.caseId)); });
        document.getElementById('back-to-feed-btn').addEventListener('click', () => switchView('feed-view'));
        document.getElementById('create-post-btn').addEventListener('click', () => { const text = document.getElementById('create-post-text'); const image = document.getElementById('create-post-image'); if(text.value.trim()){ postsDB.unshift({id: Date.now(), author: currentUser.name, role: 'Advogado', text: text.value, image: image.value, timestamp: 'Agora mesmo'}); text.value = ''; image.value = ''; renderFeed(); } });
        document.getElementById('chat-list').addEventListener('click', e => { const item = e.target.closest('.chat-list-item'); if(item) loadChat(item.dataset.chatId); });
        document.getElementById('chat-send-btn').addEventListener('click', () => { const input = document.getElementById('chat-message-input'); if (input.value.trim() && activeChatId) { chatsDB[activeChatId].push({ sender: currentUser.name, text: input.value }); input.value = ''; loadChat(activeChatId); } });
        document.getElementById('chat-message-input').addEventListener('keypress', e => { if (e.key === 'Enter') document.getElementById('chat-send-btn').click(); });
        document.getElementById('chat-attach-btn').addEventListener('click', () => document.getElementById('chat-file-input').click());
        document.getElementById('chat-file-input').addEventListener('change', e => { const file = e.target.files[0]; if(file && activeChatId) { const fileInfo = { name: file.name, size: `${(file.size / 1024 / 1024).toFixed(2)} MB` }; chatsDB[activeChatId].push({ type: 'file', sender: currentUser.name, file: fileInfo }); const caseId = parseInt(activeChatId.replace('chat_case_', '')); const aCase = casesDB.find(c => c.id === caseId); if(aCase) aCase.documents.push(fileInfo); loadChat(activeChatId); e.target.value = ''; } });
        document.getElementById('denounce-lawyer-btn').addEventListener('click', e => { document.getElementById('denuncia-modal').style.display = 'block'; document.getElementById('denuncia-case-id').value = e.target.dataset.caseId; });
        document.getElementById('notification-bell').addEventListener('click', () => { const panel = document.getElementById('notification-panel'); panel.style.display = panel.style.display === 'block' ? 'none' : 'block'; if (panel.style.display === 'block') { notificationsDB.filter(n => n.forRole.includes(currentUser.role)).forEach(n => n.read = true); renderNotifications(); } });
        document.getElementById('register-user-form').addEventListener('submit', e => { e.preventDefault(); const name = document.getElementById('reg-name').value; const email = document.getElementById('reg-email').value; const password = document.getElementById('reg-password').value; const role = document.getElementById('reg-role').value; if(usersDB[email]) { alert('Este email já está registado.'); return; } usersDB[email] = { name, password, role, type: role.charAt(0).toUpperCase() + role.slice(1), bio: `Novo ${role} registado.` }; if(role === 'advogado') lawyers.push(name); alert(`Utilizador ${name} registado com sucesso!`); e.target.reset(); });
    }

    initAuth();
    initThemeSwitcher();
    initNavigation();
    initModals();
    initActionHandlers();
});