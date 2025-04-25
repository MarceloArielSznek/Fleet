/**
 * Fleet Management - JavaScript principal
 * Este archivo contiene todas las funcionalidades JavaScript comunes
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Fleet App: Inicializada');
  
  // Inicializar sidebar
  initSidebar();
  
  // Inicializar carrusel si existe en la página
  initCarousel();
  
  // Mostrar la ruta actual en la consola
  const currentPath = window.location.pathname;
  console.log(`Navegación: ${currentPath}`);
});

// Función para inicializar el sidebar
function initSidebar() {
  // Elementos del DOM
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.querySelector('.main-content');
  const userMenuTrigger = document.querySelector('.user-menu-trigger');
  
  // Verificar si los elementos existen
  if (!menuToggle || !sidebar || !mainContent) {
    console.error('Error: No se encontraron elementos necesarios del DOM para el sidebar');
    return;
  }
  
  // Función para activar el sidebar
  function activateSidebar() {
    sidebar.classList.add('active');
    mainContent.classList.add('sidebar-active');
    localStorage.setItem('sidebarActive', 'true');
    console.log('Sidebar: Abierto');
  }
  
  // Función para desactivar el sidebar
  function deactivateSidebar() {
    sidebar.classList.remove('active');
    mainContent.classList.remove('sidebar-active');
    localStorage.setItem('sidebarActive', 'false');
    console.log('Sidebar: Cerrado');
  }
  
  // Comprobar el estado guardado
  try {
    const sidebarShouldBeActive = localStorage.getItem('sidebarActive') === 'true';
    console.log('Estado inicial del sidebar:', sidebarShouldBeActive ? 'abierto' : 'cerrado');
    
    if (sidebarShouldBeActive) {
      activateSidebar();
    }
  } catch (e) {
    console.error('Error al acceder a localStorage:', e);
  }
  
  // Event listener para el botón de toggle
  menuToggle.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (sidebar.classList.contains('active')) {
      deactivateSidebar();
    } else {
      activateSidebar();
    }
  });
  
  // Menú de usuario
  if (userMenuTrigger) {
    const userMenu = document.createElement('div');
    userMenu.className = 'user-dropdown';
    userMenu.innerHTML = `
      <ul class="user-dropdown-menu">
        <li><a href="#"><i class="fas fa-user-circle"></i> Perfil</a></li>
        <li><a href="#"><i class="fas fa-cog"></i> Configuración</a></li>
        <li class="divider"></li>
        <li><a href="#" class="logout-link"><i class="fas fa-sign-out-alt"></i> Cerrar sesión</a></li>
      </ul>
    `;
    document.querySelector('.user-menu').appendChild(userMenu);
    
    // Toggle del menú de usuario
    userMenuTrigger.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      userMenu.classList.toggle('active');
    });
    
    // Cerrar menú de usuario al hacer clic en otro lugar
    document.addEventListener('click', function(e) {
      if (!userMenuTrigger.contains(e.target) && !userMenu.contains(e.target)) {
        userMenu.classList.remove('active');
      }
    });
  }
  
  // Marcar enlace activo en la barra lateral
  const currentPath = window.location.pathname;
  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  
  sidebarLinks.forEach(link => {
    const href = link.getAttribute('href');
    
    // Comprobar si el enlace es para la página actual
    if (href === currentPath || 
        (href !== '/' && currentPath.startsWith(href)) ||
        (href === '/' && currentPath === '/')) {
      link.classList.add('active');
    }
  });
  
  // Cerrar el sidebar en dispositivos móviles al hacer clic fuera
  document.addEventListener('click', function(e) {
    const isMobile = window.innerWidth <= 768;
    const clickedOutsideSidebar = !sidebar.contains(e.target) && !menuToggle.contains(e.target);
    
    if (isMobile && clickedOutsideSidebar && sidebar.classList.contains('active')) {
      deactivateSidebar();
    }
  });
}

// Función para inicializar el carrusel
function initCarousel() {
  const carousel = document.getElementById('vehicles-carousel');
  
  if (!carousel) {
    return; // Salir si no existe el carrusel en la página
  }
  
  console.log('Inicializando carrusel de vehículos');
  
  // Elementos del DOM
  const carouselInner = document.getElementById('carousel-inner');
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');
  const indicators = document.getElementById('carousel-indicators');
  
  // Configuración del carrusel
  let currentPosition = 0;
  let slideWidth = 0;
  let slidesPerView = 3;
  let maxPosition = 0;
  
  // Obtener las tarjetas existentes (ya creadas por el servidor)
  const vehicleCards = carouselInner.querySelectorAll('.vehicle-card');
  const totalCards = vehicleCards.length;
  
  // Si no hay tarjetas, salir
  if (totalCards === 0) {
    console.log('No hay vehículos para mostrar en el carrusel');
    prevBtn.classList.add('disabled');
    nextBtn.classList.add('disabled');
    return;
  }
  
  // Crear indicadores
  vehicleCards.forEach((card, index) => {
    const indicator = document.createElement('div');
    indicator.className = 'carousel-indicator';
    indicator.setAttribute('data-index', index);
    indicator.addEventListener('click', () => goToSlide(index));
    indicators.appendChild(indicator);
  });
  
  // Actualizar layout según el ancho de la ventana
  function updateCarouselLayout() {
    // Determinar cuántos slides mostrar según el ancho
    if (window.innerWidth < 768) {
      slidesPerView = 1;
    } else if (window.innerWidth < 992) {
      slidesPerView = 2;
    } else {
      slidesPerView = 3;
    }
    
    // Calcular el ancho de cada slide
    const carouselWidth = carousel.clientWidth;
    slideWidth = carouselWidth / slidesPerView;
    
    // Actualizar ancho de las tarjetas
    vehicleCards.forEach(card => {
      card.style.flex = `0 0 ${slideWidth - 30}px`; // 30px para los márgenes
    });
    
    // Actualizar máxima posición
    maxPosition = Math.max(0, totalCards - slidesPerView);
    
    // Reubicar al carrusel si la posición actual es inválida
    if (currentPosition > maxPosition) {
      currentPosition = maxPosition;
      updateCarouselPosition();
    }
    
    // Actualizar botones
    updateButtons();
  }
  
  // Ir a un slide específico
  function goToSlide(index) {
    currentPosition = Math.min(Math.max(0, index), maxPosition);
    updateCarouselPosition();
    updateIndicators();
    updateButtons();
  }
  
  // Actualizar posición del carrusel
  function updateCarouselPosition() {
    const translateX = -currentPosition * slideWidth;
    carouselInner.style.transform = `translateX(${translateX}px)`;
  }
  
  // Actualizar indicadores
  function updateIndicators() {
    const allIndicators = document.querySelectorAll('.carousel-indicator');
    allIndicators.forEach((indicator, index) => {
      if (index === currentPosition) {
        indicator.classList.add('active');
      } else {
        indicator.classList.remove('active');
      }
    });
  }
  
  // Actualizar estado de los botones
  function updateButtons() {
    if (currentPosition <= 0) {
      prevBtn.classList.add('disabled');
    } else {
      prevBtn.classList.remove('disabled');
    }
    
    if (currentPosition >= maxPosition) {
      nextBtn.classList.add('disabled');
    } else {
      nextBtn.classList.remove('disabled');
    }
  }
  
  // Event listeners para los botones
  prevBtn.addEventListener('click', () => {
    if (currentPosition > 0) {
      goToSlide(currentPosition - 1);
    }
  });
  
  nextBtn.addEventListener('click', () => {
    if (currentPosition < maxPosition) {
      goToSlide(currentPosition + 1);
    }
  });
  
  // Escuchar cambios en el tamaño de la ventana
  window.addEventListener('resize', updateCarouselLayout);
  
  // Inicializar el carrusel
  updateCarouselLayout();
  goToSlide(0);
  
  // Auto-rotación del carrusel cada 5 segundos
  let autoplayInterval = setInterval(() => {
    if (currentPosition < maxPosition) {
      goToSlide(currentPosition + 1);
    } else {
      goToSlide(0);
    }
  }, 5000);
  
  // Detener auto-rotación al interactuar
  carousel.addEventListener('mouseenter', () => {
    clearInterval(autoplayInterval);
  });
  
  // Reanudar auto-rotación al dejar de interactuar
  carousel.addEventListener('mouseleave', () => {
    autoplayInterval = setInterval(() => {
      if (currentPosition < maxPosition) {
        goToSlide(currentPosition + 1);
      } else {
        goToSlide(0);
      }
    }, 5000);
  });
} 