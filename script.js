document.addEventListener('DOMContentLoaded', () => {
    let casesDB = [{ id: 1, client: "Alberto Mota", area: "Direito do Trabalho", date: "2024-05-19", status: "Pendente", assignedTo: null, rejectionReason: null },{ id: 2, client: "Joana Filipe", area: "Registo e Notariado", date: "2024-05-18", status: "Aceite", assignedTo: "Dr.ª Ana Clara", rejectionReason: null },{ id: 3, client: "Sérgio Cumbe", area: "Direito Penal", date: "2024-05-17", status: "Rejeitado", assignedTo: "Dr.ª Ana Clara", rejectionReason: "Conflito de interesses." }];
    let denunciasDB = [{ id: 1, caseId: 2, clientName: "Joana Filipe", lawyerName: "Dr.ª Ana Clara", reason: "O advogado não responde.", status: "Pendente" }];
    let chatsDB = { "chat_case_2": [{ sender: "Dr.ª Ana Clara", text: "Boa tarde Sra. Joana." },{ sender: "Joana Filipe", text: "Boa tarde Dr.ª." }], "chat_admin_DrMateusAfonso": [{ sender: "Admin IPAJ", text: "Dr. Mateus, bom dia." }] };
    let postsDB = [{ id: 1, author: "Dr. Mateus Afonso", role: "Advogado", text: "O direito à terra (DUAT) é um pilar fundamental em Moçambique. Conhecer os procedimentos corretos para o seu registo e defesa é essencial para garantir a segurança jurídica dos cidadãos e das comunidades.", image: "", timestamp: "Há 3 horas" }];
    let notificationsDB = [{ id: 1, text: "Bem-vindo ao IPAJ-Connect!", read: true, forRole: ['cliente', 'advogado', 'admin'] }];
    
    const lawyers = ["Dr. Mateus Afonso", "Dr.ª Ana Clara", "Dr.ª Elisa Mabunda"];
    const profileData = {
        cliente: { name: "Joana Filipe", type: "Cidadã", bio: "Procuro ajuda na área de Registo e Notariado.", role: 'cliente' },
        advogado: { name: "Dr. Mateus Afonso", type: "Advogado", bio: "Especialista em Direito de Terras e Contencioso.", role: 'advogado' },
        admin: { name: "Admin IPAJ", type: "Administrador", bio: "Gestor da plataforma IPAJ-Connect.", role: 'admin' }
    };
    let activeChatId = null;
    let currentUserRole = 'cliente';

    const appContainer = document.getElementById('app-container');
    const roleSelector = document.getElementById('role-selector');
    
    function initAuth() {
        document.getElementById('login-form').addEventListener('submit', (e) => { e.preventDefault(); document.getElementById('login-screen').style.display = 'none'; appContainer.style.display = 'flex'; updateUIForRole(roleSelector.value); });
        document.getElementById('signup-form').addEventListener('submit', (e) => { e.preventDefault(); document.getElementById('signup-screen').style.display = 'none'; appContainer.style.display = 'flex'; updateUIForRole('cliente'); });
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
        roleSelector.addEventListener('change', (e) => updateUIForRole(e.target.value));
    }
    
    function updateUIForRole(role) {
        currentUserRole = role;
        const data = profileData[role];
        document.getElementById('sidebar-username').textContent = data.name;
        document.getElementById('sidebar-usertype').textContent = data.type;
        document.getElementById('profile-main-name').textContent = data.name;
        document.getElementById('profile-main-bio').textContent = data.bio;
        document.querySelectorAll('.profile-avatar-header, .profile-avatar-sidebar, .profile-main-avatar').forEach(el => el.dataset.role = role);
        document.getElementById('btn-solicitar-assistencia').style.display = role === 'cliente' ? 'flex' : 'none';
        document.getElementById('create-post-section').style.display = role === 'advogado' ? 'block' : 'none';
        document.getElementById('admin-nav-link').style.display = role === 'admin' ? 'flex' : 'none';
        document.getElementById('admin-mobile-link').style.display = role === 'admin' ? 'block' : 'none';
        document.getElementById('right-sidebar').style.display = role === 'cliente' ? 'block' : 'none';
        if (role === 'admin') { switchView('admin-view'); renderAdminPanels(); }
        else { switchView('feed-view'); if (role === 'advogado') renderLawyerAssignments(); if(role === 'cliente') renderClientCases(); }
        renderNotifications();
    }

    function renderFeed() {
        const container = document.getElementById('feed-posts-container');
        container.innerHTML = postsDB.map(post => `
            <div class="post-card"><div class="post-header"><div class="avatar-icon-wrapper"><i class="fa-solid fa-user-circle"></i></div><div><h4>${post.author}</h4><p>${post.role} • ${post.timestamp}</p></div></div><div class="post-body"><p>${post.text}</p>${post.image ? `<img src="${post.image}" alt="Publicação">` : ''}</div><div class="post-actions"><span><i class="fa-regular fa-heart"></i> Reagir</span><span><i class="fa-regular fa-comment"></i> Comentar</span></div></div>
        `).join('');
    }

    function renderClientCases() {
        const list = document.getElementById('client-cases-list');
        const myCases = casesDB.filter(c => c.client === profileData.cliente.name);
        list.innerHTML = myCases.length > 0 ? myCases.map(c => `<li><a href="#"><strong>Caso #${c.id}</strong> - ${c.area}<br><small>Status: ${c.status}</small></a></li>`).join('') : '<li>Nenhum caso registado.</li>';
    }

    function renderAdminPanels() {
        const colCount = selector => document.querySelector(selector + " th").parentElement.childElementCount;
        const render = (s, d, rt) => { const t = document.querySelector(s + " tbody"); t.innerHTML = d.length > 0 ? d.map(i => `<tr data-case-id="${i.id}">${rt(i)}</tr>`).join('') : `<tr><td colspan="${colCount(s)}">Nenhum registo.</td></tr>`; };
        render('#pending-requests-table', casesDB.filter(c => c.status === 'Pendente'), c => `<td>${c.client}</td><td>${c.area}</td><td>${c.date}</td><td><select>${lawyers.map(l=>`<option>${l}</option>`).join('')}</select><button class="btn-action btn-assign">Atribuir</button></td>`);
        render('#rejected-cases-table', casesDB.filter(c => c.status === 'Rejeitado'), c => `<td>${c.assignedTo}</td><td>${c.client}</td><td>${c.rejectionReason}</td><td><button class="btn-action btn-admin-action" data-action="reassign">Reatribuir</button></td>`);
        render('#denuncias-table', denunciasDB, d => `<td>${d.clientName}</td><td>${d.lawyerName}</td><td>${d.reason}</td><td><span class="status-${d.status.toLowerCase().replace(/\s/g, '-')}">${d.status}</span></td>`);
    }

    function renderLawyerAssignments() {
        const list = document.getElementById('lawyer-assignments-list');
        const assignedCases = casesDB.filter(c => c.status === 'Atribuído' && c.assignedTo === profileData.advogado.name);
        list.innerHTML = assignedCases.length > 0 ? assignedCases.map(c => `<div class="assignment-card" data-case-id="${c.id}"><h4>Novo Caso: Cliente ${c.client}</h4><p>Área: ${c.area}</p><div class="assignment-actions"><button class="btn-action btn-accept">Aceitar</button><button class="btn-action btn-reject">Rejeitar</button></div></div>`).join('') : '<p>De momento não tem novas atribuições.</p>';
    }

    function renderChatList() {
        const list = document.getElementById('chat-list');
        let conversations = [];
        const currentUserName = profileData[currentUserRole].name;
        if (currentUserRole === 'cliente') { const myCase = casesDB.find(c => c.client === currentUserName && c.status === 'Aceite'); if (myCase) conversations.push({ id: `chat_case_${myCase.id}`, name: myCase.assignedTo, role: 'Advogado' }); }
        else if (currentUserRole === 'advogado') { casesDB.filter(c => c.assignedTo === currentUserName && c.status === 'Aceite').forEach(c => conversations.push({ id: `chat_case_${c.id}`, name: c.client, role: `Cliente (Caso #${c.id})` })); conversations.push({ id: `chat_admin_${currentUserName.replace(/[\s.ª]/g, '')}`, name: 'Admin IPAJ', role: 'Administração' }); }
        else if (currentUserRole === 'admin') { lawyers.forEach(l => conversations.push({ id: `chat_admin_${l.replace(/[\s.ª]/g, '')}`, name: l, role: 'Advogado' })); }
        list.innerHTML = conversations.length > 0 ? conversations.map(c => `<div class="chat-list-item" data-chat-id="${c.id}"><div class="avatar-icon-wrapper"><i class="fa-solid fa-user-circle"></i></div><div class="chat-list-item-info"><strong>${c.name}</strong><p>${c.role}</p></div></div>`).join('') : '<p class="empty-chat-list">Nenhuma conversa.</p>';
    }

    function loadChat(chatId) {
        activeChatId = chatId; if (!chatsDB[chatId]) chatsDB[chatId] = [];
        document.querySelectorAll('.chat-list-item').forEach(i => i.classList.toggle('active', i.dataset.chatId === chatId));
        document.getElementById('chat-welcome-screen').style.display = 'none';
        document.getElementById('chat-conversation-area').style.display = 'flex';
        const messages = chatsDB[chatId];
        const chatMessages = document.querySelector('.chat-messages');
        chatMessages.innerHTML = messages.map(msg => `<div class="message ${msg.sender === profileData[currentUserRole].name ? 'message-sent' : 'message-received'}"><p>${msg.text}</p></div>`).join('');
        chatMessages.scrollTop = chatMessages.scrollHeight;
        const partner = document.querySelector(`.chat-list-item[data-chat-id='${chatId}']`);
        document.getElementById('chat-with-name').textContent = partner.querySelector('strong').textContent;
        document.getElementById('chat-with-role').textContent = partner.querySelector('p').textContent;
        const denounceBtn = document.getElementById('denounce-lawyer-btn');
        if (currentUserRole === 'cliente' && chatId.startsWith('chat_case_')) { denounceBtn.style.display = 'block'; denounceBtn.dataset.caseId = chatId.replace('chat_case_',''); } else { denounceBtn.style.display = 'none'; }
    }

    function addNotification(text, roles) { notificationsDB.unshift({ id: Date.now(), text, read: false, forRole: roles }); renderNotifications(); }
    function renderNotifications() {
        const list = document.getElementById('notification-list');
        const userNotifications = notificationsDB.filter(n => n.forRole.includes(currentUserRole));
        list.innerHTML = userNotifications.length > 0 ? userNotifications.map(n => `<div class="notification-item ${n.read ? '' : 'unread'}"><p>${n.text}</p></div>`).join('') : '<p class="empty-notification">Nenhuma notificação.</p>';
        document.querySelector('.notification-dot').style.display = userNotifications.some(n => !n.read) ? 'block' : 'none';
    }

    function initModals() {
        document.getElementById('btn-solicitar-assistencia').addEventListener('click', () => document.getElementById('assistencia-modal').style.display = 'block');
        document.querySelector('.mobile-assistencia-btn').addEventListener('click', () => document.getElementById('assistencia-modal').style.display = 'block');
        document.querySelectorAll('.modal').forEach(modal => { modal.querySelector('.close-modal').addEventListener('click', () => modal.style.display = 'none'); window.addEventListener('click', (e) => { if (e.target == modal) modal.style.display = 'none'; }); });
        document.getElementById('assistencia-form').addEventListener('submit', e => { e.preventDefault(); casesDB.push({ id: Date.now(), client: profileData.cliente.name, area: e.target.querySelector('#area-direito').value, date: new Date().toISOString().split('T')[0], status: 'Pendente' }); addNotification('Nova solicitação de assistência recebida.', ['admin']); alert('Solicitação enviada!'); e.target.parentElement.parentElement.style.display = 'none'; updateUIForRole(currentUserRole); });
        document.getElementById('rejection-form').addEventListener('submit', e => { e.preventDefault(); const id = parseInt(e.target.querySelector('#rejection-case-id').value); const c = casesDB.find(c=>c.id===id); if(c){ c.status = 'Rejeitado'; c.rejectionReason = e.target.querySelector('#rejection-reason').value; } addNotification(`O caso de ${c.client} foi rejeitado por si.`, ['admin']); alert('Caso Rejeitado.'); e.target.parentElement.parentElement.style.display = 'none'; updateUIForRole(currentUserRole); });
        document.getElementById('denuncia-form').addEventListener('submit', e => { e.preventDefault(); const caseId = parseInt(e.target.querySelector('#denuncia-case-id').value); const c = casesDB.find(c=>c.id===caseId); if(c){ denunciasDB.push({ id: Date.now(), caseId: caseId, clientName: c.client, lawyerName: c.assignedTo, reason: e.target.querySelector('#denuncia-reason').value, status: 'Pendente' }); } addNotification(`Nova denúncia contra ${c.assignedTo}.`, ['admin']); alert('Denúncia enviada.'); e.target.parentElement.parentElement.style.display = 'none'; updateUIForRole(currentUserRole); });
    }

    function initActionHandlers() {
        document.getElementById('main-content').addEventListener('click', e => {
            const caseTarget = e.target.closest('[data-case-id]');
            if (caseTarget) {
                const caseId = parseInt(caseTarget.dataset.caseId);
                const aCase = casesDB.find(c => c.id === caseId);
                if (e.target.matches('.btn-assign')) { aCase.status = 'Atribuído'; aCase.assignedTo = caseTarget.querySelector('select').value; addNotification(`O seu caso #${aCase.id} foi atribuído.`, ['cliente']); addNotification(`Foi-lhe atribuído o caso #${aCase.id}.`, ['advogado']); alert('Caso atribuído.'); renderAdminPanels(); }
                if (e.target.matches('.btn-admin-action[data-action="reassign"]')) { aCase.status = 'Pendente'; aCase.assignedTo = null; aCase.rejectionReason = null; alert('Caso reatribuído.'); renderAdminPanels(); }
                if (e.target.matches('.btn-accept')) { aCase.status = 'Aceite'; addNotification(`O seu caso #${aCase.id} foi aceite.`, ['cliente']); alert('Caso aceite.'); renderLawyerAssignments(); }
                if (e.target.matches('.btn-reject')) { document.getElementById('rejection-modal').style.display = 'block'; document.getElementById('rejection-case-id').value = caseId; }
            }
        });
        document.getElementById('create-post-btn').addEventListener('click', () => {
            const text = document.getElementById('create-post-text'); const image = document.getElementById('create-post-image');
            if(text.value.trim()){ postsDB.unshift({id: Date.now(), author: profileData.advogado.name, role: 'Advogado', text: text.value, image: image.value, timestamp: 'Agora mesmo'}); text.value = ''; image.value = ''; renderFeed(); }
        });
        document.getElementById('chat-list').addEventListener('click', e => { const item = e.target.closest('.chat-list-item'); if(item) loadChat(item.dataset.chatId); });
        document.getElementById('chat-send-btn').addEventListener('click', () => { const input = document.getElementById('chat-message-input'); if (input.value.trim() && activeChatId) { chatsDB[activeChatId].push({ sender: profileData[currentUserRole].name, text: input.value }); input.value = ''; loadChat(activeChatId); } });
        document.getElementById('chat-message-input').addEventListener('keypress', e => { if (e.key === 'Enter') document.getElementById('chat-send-btn').click(); });
        document.getElementById('denounce-lawyer-btn').addEventListener('click', e => { document.getElementById('denuncia-modal').style.display = 'block'; document.getElementById('denuncia-case-id').value = e.target.dataset.caseId; });
        document.getElementById('notification-bell').addEventListener('click', () => {
            const panel = document.getElementById('notification-panel');
            panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
            if (panel.style.display === 'block') { notificationsDB.forEach(n => n.read = true); renderNotifications(); }
        });
    }

    initAuth();
    initThemeSwitcher();
    initNavigation();
    initModals();
    initActionHandlers();
});