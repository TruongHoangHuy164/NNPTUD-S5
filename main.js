// Basic front-end logic to load posts & comments from JSON Server
// Assumes JSON Server running: json-server --watch db.json --port 3000

const API_BASE = 'http://localhost:3000'

const state = {
    posts: [],
    filtered: [],
    selectedPostId: null,
    loading: false,
    commentsLoading: false
}

// Elements
const postsBody = document.getElementById('postsBody')
const loadingEl = document.getElementById('loading')
const errorEl = document.getElementById('error')
const searchInput = document.getElementById('searchInput')
const countInfo = document.getElementById('countInfo')
const reloadBtn = document.getElementById('reloadBtn')
const commentsList = document.getElementById('commentsList')
const commentsEmpty = document.getElementById('commentsEmpty')
// CRUD form elements
const postForm = document.getElementById('postForm')
const postIdInput = document.getElementById('postId')
const titleInput = document.getElementById('titleInput')
const viewsInput = document.getElementById('viewsInput')
const resetBtn = document.getElementById('resetBtn')
const deleteBtn = document.getElementById('deleteBtn')
const actionMsg = document.getElementById('actionMsg')

function getNextPostIdStr () {
    // Lấy id số lớn nhất (kể cả đang ở dạng chuỗi) => trả về dạng chuỗi (max + 1)
    let maxId = 0
    for (const p of state.posts) {
        const val = String(p.id)
        if (/^\d+$/.test(val)) {
            const n = Number(val)
            if (n > maxId) maxId = n
        }
    }
    return String(maxId + 1)
}

reloadBtn.addEventListener('click', () => loadPosts())
searchInput.addEventListener('input', () => {
    applyFilter(searchInput.value.trim())
    renderPosts()
})

function setLoading (val) {
    state.loading = val
    loadingEl.hidden = !val
}

function setError (msg) {
    if (msg) {
        errorEl.textContent = msg
        errorEl.hidden = false
    } else {
        errorEl.textContent = ''
        errorEl.hidden = true
    }
}

async function loadPosts () {
    setError(null)
    setLoading(true)
    try {
    const raw = await api('/posts')
        // Chuẩn hóa id -> chuỗi, thêm _sortId để sắp xếp
        state.posts = raw.map(p => {
            const idStr = String(p.id)
            const isNumeric = /^\d+$/.test(idStr)
            return { ...p, id: idStr, _sortId: isNumeric ? Number(idStr) : Number.MAX_SAFE_INTEGER }
        }).sort((a, b) => a._sortId - b._sortId)
        applyFilter(searchInput.value.trim())
        renderPosts()
    } catch (err) {
        setError('Không tải được danh sách: ' + err.message)
    } finally {
        setLoading(false)
    }
}

function applyFilter (keyword) {
    if (!keyword) {
        state.filtered = [...state.posts]
    } else {
        const lower = keyword.toLowerCase()
        state.filtered = state.posts.filter(p => p.title.toLowerCase().includes(lower))
    }
    countInfo.textContent = state.filtered.length + ' / ' + state.posts.length + ' bài viết'
}

function renderPosts () {
    postsBody.innerHTML = ''
    const frag = document.createDocumentFragment()
    state.filtered.forEach(p => {
        const tr = document.createElement('tr')
        if (p.id === state.selectedPostId) tr.classList.add('active')
        tr.innerHTML = `<td>${p.id}</td><td>${escapeHtml(p.title || '')}</td><td>${p.views ?? 0}</td>`
        tr.addEventListener('click', () => { selectPost(p.id); fillFormForEdit(p) })
        frag.appendChild(tr)
    })
    postsBody.appendChild(frag)
}

function escapeHtml (str) {
    return str.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

async function selectPost (id) {
    if (state.selectedPostId === id) return
    state.selectedPostId = id
    renderPosts()
    await loadComments(id)
}

function fillFormForEdit (post) {
    postIdInput.value = post.id
    titleInput.value = post.title
    viewsInput.value = post.views
    deleteBtn.disabled = false
    actionMsg.textContent = ''
    actionMsg.className = 'action-msg'
}

function resetForm () {
    postIdInput.value = ''
    titleInput.value = ''
    viewsInput.value = 0
    deleteBtn.disabled = true
    actionMsg.textContent = ''
    actionMsg.className = 'action-msg'
}

resetBtn?.addEventListener('click', e => { e.preventDefault(); resetForm() })

postForm?.addEventListener('submit', async e => {
    e.preventDefault()
    const id = postIdInput.value.trim()
    const payload = {
        title: titleInput.value.trim(),
        views: Number(viewsInput.value) || 0
    }
    if (!payload.title) {
        showActionMessage('Tiêu đề không được rỗng', true)
        return
    }
    try {
        if (id) {
            // Update
            await api(`/posts/${encodeURIComponent(id)}`, { method: 'PUT', body: payload })
            showActionMessage('Đã cập nhật!', false)
        } else {
            // Create with manual incremental id (max numeric + 1)
            const nextId = getNextPostIdStr()
            const createPayload = { id: nextId, ...payload }
            await api('/posts', { method: 'POST', body: createPayload })
            showActionMessage('Đã tạo bài viết!', false)
            resetForm()
        }
        await loadPosts()
    } catch (err) {
        showActionMessage('Lỗi lưu: ' + err.message, true)
    }
})

deleteBtn?.addEventListener('click', async () => {
    const id = postIdInput.value.trim()
    if (!id) return
    if (!confirm('Xóa bài viết #' + id + '?')) return
    try {
        // Pre-check existence to give clearer feedback
        try {
            await api(`/posts/${encodeURIComponent(id)}`)
        } catch (e) {
            if (String(e.message).includes('404')) {
            showActionMessage(`Không tìm thấy bài viết #${id} (có thể đã bị xóa trước đó). Làm mới danh sách...`, true)
            await loadPosts()
            return
            }
            throw e
        }
        await api(`/posts/${encodeURIComponent(id)}`, { method: 'DELETE' })
        showActionMessage('Đã xóa!', false)
        resetForm()
        if (String(state.selectedPostId) === String(id)) {
            state.selectedPostId = null
            commentsList.innerHTML = ''
            commentsEmpty.textContent = 'Chọn một bài viết để xem bình luận...'
        }
        await loadPosts()
    } catch (err) {
        showActionMessage('Lỗi xóa: ' + err.message, true)
    }
})

function showActionMessage (msg, isError) {
    actionMsg.textContent = msg
    actionMsg.className = 'action-msg ' + (isError ? 'error' : 'success')
}

async function loadComments (postId) {
    commentsEmpty.textContent = 'Đang tải bình luận...'
    commentsList.innerHTML = ''
    try {
        const comments = await api(`/comments?postId=${encodeURIComponent(postId)}`)
        commentsEmpty.textContent = comments.length === 0 ? 'Không có bình luận.' : ''
        const frag = document.createDocumentFragment()
        comments.forEach(c => {
            const li = document.createElement('li')
            li.className = 'comment'
            li.textContent = c.text
            frag.appendChild(li)
        })
        commentsList.appendChild(frag)
    } catch (err) {
        commentsEmpty.textContent = 'Lỗi tải bình luận: ' + err.message
    }
}

// Generic fetch helper using async/await
async function api (path, options = {}) {
    const { method = 'GET', body, headers = {} } = options
    const fetchOptions = { method, headers: { ...headers } }
    if (body !== undefined) {
        fetchOptions.headers['Content-Type'] = 'application/json'
        fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body)
    }
    const res = await fetch(`${API_BASE}${path}`, fetchOptions)
    if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`${res.status} ${res.statusText}${text ? ' - ' + text : ''}`)
    }
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) return res.json()
    return res.text()
}

// Initial load
loadPosts()
