// =============================================
//  CineMatch Pro — main.js
//  Responsável pelo formulário e localStorage
// =============================================

// ─── Classe Filme ────────────────────────────
class Filme {
  constructor({ titulo, ano, genero, duracao, nota, sinopse, capa, trailer }) {
    this.id       = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    this.titulo   = titulo;
    this.ano      = ano;
    this.genero   = genero;
    this.duracao  = Number(duracao) || 0;   // em minutos
    this.nota     = Number(nota) || 0;
    this.sinopse  = sinopse;
    this.capa     = capa;                   // URL da imagem
    this.trailer  = trailer;               // ID do vídeo no YouTube
    this.addedAt  = new Date().toISOString();
  }
}

// ─── Utilitários de Storage ──────────────────
const Storage = {
  KEY: 'cinematch_filmes',

  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY)) ?? [];
    } catch {
      return [];
    }
  },

  save(lista) {
    localStorage.setItem(this.KEY, JSON.stringify(lista));
  },

  add(filme) {
    const lista = this.getAll();
    lista.push(filme);
    this.save(lista);
  },

  remove(id) {
    const lista = this.getAll().filter(f => f.id !== id);
    this.save(lista);
  }
};

// ─── Toast ───────────────────────────────────
function showToast(mensagem, icone = '🎬') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.querySelector('.toast-msg').textContent = mensagem;
  toast.querySelector('.toast-icon').textContent = icone;
  toast.classList.add('show');

  setTimeout(() => toast.classList.remove('show'), 3200);
}

// ─── Preview em tempo real ───────────────────
function initPreview() {
  const campos = {
    titulo:   document.getElementById('titulo'),
    ano:      document.getElementById('ano'),
    genero:   document.getElementById('genero'),
    nota:     document.getElementById('nota'),
    capa:     document.getElementById('capa'),
  };

  const previewTitulo = document.getElementById('prev-titulo');
  const previewMeta   = document.getElementById('prev-meta');
  const previewImg    = document.getElementById('prev-img');
  const previewEmpty  = document.getElementById('prev-empty');

  if (!previewTitulo) return;

  function atualizar() {
    const titulo = campos.titulo?.value.trim();
    const ano    = campos.ano?.value.trim();
    const genero = campos.genero?.value;
    const nota   = campos.nota?.value;
    const capa   = campos.capa?.value.trim();

    if (titulo) {
      previewEmpty?.classList.add('hidden');
      previewTitulo.textContent = titulo;
      previewMeta.textContent   = [ano, genero, nota ? `★ ${nota}` : ''].filter(Boolean).join(' · ');
      previewImg.src = capa || '';
      previewImg.style.display = capa ? 'block' : 'none';
    } else {
      previewEmpty?.classList.remove('hidden');
    }
  }

  Object.values(campos).forEach(el => el?.addEventListener('input', atualizar));
}

// ─── Formulário ──────────────────────────────
function initForm() {
  const form = document.getElementById('form-cadastro');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const dados = {
      titulo:  document.getElementById('titulo').value.trim(),
      ano:     document.getElementById('ano').value.trim(),
      genero:  document.getElementById('genero').value,
      duracao: document.getElementById('duracao').value.trim(),
      nota:    document.getElementById('nota').value,
      sinopse: document.getElementById('sinopse').value.trim(),
      capa:    document.getElementById('capa').value.trim(),
      trailer: extrairYoutubeId(document.getElementById('trailer').value.trim()),
    };

    if (!dados.titulo) {
      showToast('Informe o título do filme.', '⚠️');
      return;
    }

    const filme = new Filme(dados);
    Storage.add(filme);
    showToast(`"${filme.titulo}" adicionado ao catálogo!`, '✅');
    form.reset();
    atualizarContador();
  });
}

// ─── Extrair ID do YouTube ───────────────────
function extrairYoutubeId(url) {
  if (!url) return '';
  // Aceita: https://youtu.be/ID, ?v=ID, embed/ID ou o próprio ID
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : url;
}

// ─── Contador de filmes salvos ───────────────
function atualizarContador() {
  const el = document.getElementById('qtd-salvos');
  if (!el) return;
  const total = Storage.getAll().length;
  el.textContent = `${total} filme${total !== 1 ? 's' : ''} no catálogo`;
}

// ─── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initForm();
  initPreview();
  atualizarContador();
});
