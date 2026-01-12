document.addEventListener('dragstart', (e) => {
  if (e.target.tagName === 'IMG') {
    e.preventDefault();
    return false;
  }
});

class SmoothCursor {
  constructor() {
    this.cursor = document.querySelector('.custom-cursor');
    this.content = document.querySelector('.content');
    this.pos = { x: 0, y: 0 };
    this.mouse = { x: 0, y: 0 };
    this.scrollPos = 0;
    this.targetScrollPos = 0;
    this.cursorSpeed = 0.25;
    this.scrollSpeed = 0.2;
    this.isMobile = false;
    this.isInitialized = false;
    
    // Для автоскролла
    this.autoScrollEnabled = false; // НЕ включаем сразу
    this.autoScrollSpeed = 20;
    this.autoScrollDirection = 1;
    this.maxScroll = 0;
    this.userHasScrolled = false;
    this.autoScrollStartTime = 0;
    this.lastFrameTime = 0;
    this.autoScrollDelay = 1000; // Задержка 1 секунда
    
    this.init();
  }
  
  init() {
    this.checkIfMobile();
    
    if (this.isMobile) {
      this.disableCursor();
      return;
    }
    
    this.setupDesktopCursor();
    this.setupSmoothScroll();
    this.setupAutoScrollWithDelay(); // Задержка перед стартом
    
    window.addEventListener('resize', this.handleResize.bind(this));
    
    this.lastFrameTime = performance.now();
    this.animate();
  }
  
  checkIfMobile() {
    this.isMobile = (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches
    );
  }
  
  disableCursor() {
    this.cursor.style.display = 'none';
    document.body.style.cursor = 'auto';
  }
  
  setupDesktopCursor() {
    document.body.style.cursor = 'none';
    
    this.cursor.style.opacity = '1';
    this.cursor.style.display = 'block';
    
    document.addEventListener('mousemove', (e) => {
      if (!this.isInitialized) {
        this.pos.x = e.clientX;
        this.pos.y = e.clientY;
        this.cursor.style.transform = `translate(${this.pos.x}px, ${this.pos.y}px)`;
        this.isInitialized = true;
      }
      
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    
    document.addEventListener('mouseleave', () => {
      this.cursor.style.opacity = '0';
    });
    
    document.addEventListener('mouseenter', () => {
      this.cursor.style.opacity = '1';
    });
  }
  
  setupSmoothScroll() {
    this.scrollPos = this.content.scrollTop;
    this.targetScrollPos = this.content.scrollTop;
    this.maxScroll = this.content.scrollHeight - this.content.clientHeight;
    
    let isDragging = false;
    let startY = 0;
    let startScrollTop = 0;
    
    const handleWheel = (e) => {
      e.preventDefault();
      
      if (this.autoScrollEnabled) {
        this.autoScrollEnabled = false;
        this.userHasScrolled = true;
      }
      
      this.targetScrollPos += e.deltaY * 0.8;
      this.targetScrollPos = Math.max(0, Math.min(this.maxScroll, this.targetScrollPos));
    };
    
    this.content.addEventListener('wheel', handleWheel, { passive: false });
    
    // Обработчик начала перетаскивания
    const handleMouseDown = (e) => {
      // Разрешаем drag на всем content и его дочерних элементах (кроме изображений для перетаскивания)
      // Проверяем что клик был внутри content
      if (!this.content.contains(e.target)) return;
      
      // Для изображений - предотвращаем стандартное перетаскивание
      if (e.target.tagName === 'IMG') {
        // Но разрешаем drag-to-scroll на изображениях
        // Только предотвращаем стандартное поведение браузера
        e.preventDefault();
      }
      
      isDragging = true;
      startY = e.clientY;
      startScrollTop = this.content.scrollTop;
      
      // Меняем курсоры
      this.content.style.cursor = 'grabbing';
      document.body.style.cursor = 'grabbing';
      if (this.cursor) {
        this.cursor.style.opacity = '0'; // Прячем кастомный курсор при drag
      }
      
      // Останавливаем автоскролл
      if (this.autoScrollEnabled) {
        this.autoScrollEnabled = false;
        this.userHasScrolled = true;
      }
      
      // Предотвращаем выделение текста при drag
      e.preventDefault();
      return false;
    };
    
    // Обработчик перемещения мыши
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const deltaY = startY - e.clientY;
      this.targetScrollPos = startScrollTop + deltaY;
      this.targetScrollPos = Math.max(0, Math.min(this.maxScroll, this.targetScrollPos));
      
      // Мгновенное обновление для отзывчивого dragging
      this.content.scrollTop = this.targetScrollPos;
    };
    
    // Обработчик отпускания мыши
    const handleMouseUp = () => {
      if (!isDragging) return;
      
      isDragging = false;
      
      // Возвращаем курсоры
      this.content.style.cursor = '';
      document.body.style.cursor = 'none';
      if (this.cursor) {
        this.cursor.style.opacity = '1';
      }
    };
    
    // Обработчики событий
    this.content.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Предотвращаем выделение при drag
    this.content.addEventListener('selectstart', (e) => {
      if (isDragging) {
        e.preventDefault();
        return false;
      }
    });
    
    // Предотвращаем стандартное перетаскивание изображений (но разрешаем drag-to-scroll)
    this.content.addEventListener('dragstart', (e) => {
      if (e.target.tagName === 'IMG') {
        e.preventDefault();
        return false;
      }
    });
    
    // Для мобильных устройств (touch events)
    let isTouching = false;
    let touchStartY = 0;
    let touchStartScrollTop = 0;
    
    this.content.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isTouching = true;
        touchStartY = e.touches[0].clientY;
        touchStartScrollTop = this.content.scrollTop;
        
        if (this.autoScrollEnabled) {
          this.autoScrollEnabled = false;
          this.userHasScrolled = true;
        }
        
        e.preventDefault();
      }
    }, { passive: false });
    
    this.content.addEventListener('touchmove', (e) => {
      if (!isTouching || e.touches.length !== 1) return;
      
      const deltaY = touchStartY - e.touches[0].clientY;
      this.targetScrollPos = touchStartScrollTop + deltaY;
      this.targetScrollPos = Math.max(0, Math.min(this.maxScroll, this.targetScrollPos));
      
      this.content.scrollTop = this.targetScrollPos;
      e.preventDefault();
    }, { passive: false });
    
    this.content.addEventListener('touchend', () => {
      isTouching = false;
    });
    
    this.content.addEventListener('scroll', () => {
      this.scrollPos = this.content.scrollTop;
      this.targetScrollPos = this.content.scrollTop;
    });
  }
  setupAutoScrollWithDelay() {
    // Ждем 1 секунду перед включением автоскролла
    setTimeout(() => {
      if (!this.userHasScrolled) {
        this.autoScrollEnabled = true;
        this.autoScrollStartTime = performance.now();
        
        // Устанавливаем небольшое начальное смещение
        if (this.maxScroll > 0) {
          this.targetScrollPos = 1;
        }
      }
    }, this.autoScrollDelay);
  }
  
  handleResize() {
    if (this.pos.x > window.innerWidth) {
      this.pos.x = window.innerWidth - 10;
    }
    if (this.pos.y > window.innerHeight) {
      this.pos.y = window.innerHeight - 10;
    }
    
    this.maxScroll = this.content.scrollHeight - this.content.clientHeight;
  }
  
  animate(currentTime = performance.now()) {
    if (this.isMobile) return;
    
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    
    // Курсор
    if (this.isInitialized) {
      this.pos.x += (this.mouse.x - this.pos.x) * this.cursorSpeed;
      this.pos.y += (this.mouse.y - this.pos.y) * this.cursorSpeed;
      
      this.pos.x = Math.max(5, Math.min(window.innerWidth - 5, this.pos.x));
      this.pos.y = Math.max(5, Math.min(window.innerHeight - 5, this.pos.y));
      
      this.cursor.style.transform = `translate(${this.pos.x}px, ${this.pos.y}px)`;
    }
    
    // Автоскролл (только если включен)
    if (this.autoScrollEnabled && this.content && this.maxScroll > 0) {
      const scrollAmount = (this.autoScrollSpeed * deltaTime) / 1000;
      this.targetScrollPos += scrollAmount * this.autoScrollDirection;
      
      if (this.targetScrollPos >= this.maxScroll) {
        this.targetScrollPos = this.maxScroll;
        this.autoScrollDirection = -1;
      } else if (this.targetScrollPos <= 0) {
        this.targetScrollPos = 0;
        this.autoScrollDirection = 1;
      }
    }
    
    // Плавный скролл (работает всегда)
    if (this.content) {
      this.scrollPos += (this.targetScrollPos - this.scrollPos) * this.scrollSpeed;
      this.scrollPos = Math.max(0, Math.min(this.maxScroll, this.scrollPos));
      this.content.scrollTop = this.scrollPos;
    }
    
    requestAnimationFrame((time) => this.animate(time));
  }
}

// Запускаем когда DOM загружен
document.addEventListener('DOMContentLoaded', () => {
  // Не запускаем SmoothCursor сразу - он запустится из Preloader
});

// Без прелоадера тоже не запускаем - Preloader сам решит

class Preloader {
  constructor() {
    this.preloader = document.querySelector('.preloader');
    this.container = document.querySelector('.container');
    this.dots = document.querySelectorAll('.preloader-dot');
    this.letterE = document.querySelector('.preloader-letter');
    this.init();
  }
  
  init() {
    // Скрываем контейнер
    this.container.style.opacity = '0';
    this.container.style.pointerEvents = 'none';
    
    // Все точки видны
    this.dots.forEach(dot => {
      dot.style.opacity = '1';
    });
    
    setTimeout(() => {
      this.startAnimation();
    }, 100);
  }
  
  startAnimation() {
    if (this.dots.length === 0) {
      this.finishPreloader();
      return;
    }
    
    // Выбираем 3 случайные точки
    const animatedDots = this.getRandomDots(3, this.dots.length);
    const thirdDot = this.dots[animatedDots[2]];
    const thirdDotRect = thirdDot.getBoundingClientRect();
    
    // Позиционируем букву на месте третьей точки
    this.letterE.style.position = 'fixed';
    this.letterE.style.top = `${thirdDotRect.top + thirdDotRect.height/2}px`;
    this.letterE.style.left = `${thirdDotRect.left + thirdDotRect.width/2}px`;
    this.letterE.style.transform = 'translate(-50%, -50%) scale(0)';
    this.letterE.style.fontSize = `${Math.min(thirdDotRect.height, thirdDotRect.width) * 0.7}px`;
    this.letterE.style.fontWeight = 'bold';
    
    const stepDuration = 350;
    
    // Анимация: точка1 исчезает → появляется+точка2 исчезает → появляется+точка3 исчезает → появляется буква
    setTimeout(() => {
      this.dots[animatedDots[0]].style.opacity = '0';
      
      setTimeout(() => {
        this.dots[animatedDots[0]].style.opacity = '1';
        this.dots[animatedDots[1]].style.opacity = '0';
        
        setTimeout(() => {
          this.dots[animatedDots[1]].style.opacity = '1';
          this.dots[animatedDots[2]].style.opacity = '0';
          
          setTimeout(() => {
            this.letterE.style.opacity = '1';
            this.letterE.style.transform = 'translate(-50%, -50%) scale(1)';
          }, 100);
          
        }, stepDuration);
        
      }, stepDuration);
      
    }, stepDuration);
    
    // Завершаем через 2 секунды
    setTimeout(() => {
      this.finishPreloader();
    }, 2000);
  }
  
  getRandomDots(count, totalDots) {
    const indices = Array.from({length: totalDots}, (_, i) => i);
    const shuffled = indices.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
  
  finishPreloader() {
    // Показываем контейнер
    this.container.style.opacity = '1';
    this.container.style.pointerEvents = 'auto';
    
    // Запускаем анимацию размытия всего прелоадера
    setTimeout(() => {
      this.preloader.classList.add('slide-up');
      
      // После завершения анимации размытия (0.9s) скрываем прелоадер
      setTimeout(() => {
        this.preloader.style.display = 'none';
        
        if (typeof SmoothCursor !== 'undefined') {
          new SmoothCursor();
        }
      }, 900); // Длительность анимации blurOut
    }, 50); // Небольшая задержка
  }
}

// Запускаем прелоадер при загрузке
document.addEventListener('DOMContentLoaded', () => {
  new Preloader();
});

// Если страница уже загружена и нет прелоадера, запускаем сразу SmoothCursor
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  if (!document.querySelector('.preloader')) {
    setTimeout(() => {
      if (typeof SmoothCursor !== 'undefined') {
        new SmoothCursor();
      }
    }, 1);
  }
}

class ProjectView {
  constructor() {
    this.projectContent = document.querySelector('.project-content');
    this.contentGrid = document.querySelector('.content');
    this.goBackBtn = document.querySelector('.project-go-back');
    this.projectTextBlock = document.querySelector('.project-text-block');
    this.cards = document.querySelectorAll('.card');
    this.isProjectOpen = false;
    
    this.init();
  }
  
  init() {
    // Клик по карточке
    this.cards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (this.isProjectOpen) return;
        this.openProject(e);
      });
    });
    
    // Кнопка возврата
    this.goBackBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.closeProject();
    });
    
    // Закрытие по ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isProjectOpen) {
        this.closeProject();
      }
    });
  }
  
// В методе openProject добавляем проверку для terracotta:
openProject(e) {
  const card = e.currentTarget;
  const cardImage = card.querySelector('img');
  const cardTitle = card.querySelector('.text').textContent.trim().toLowerCase();
  
  // Останавливаем автоскролл
  if (window.smoothCursorInstance) {
    window.smoothCursorInstance.autoScrollEnabled = false;
  }
  
  // Показываем проект, скрываем карточки
  this.projectContent.classList.add('active');
  this.contentGrid.style.opacity = '0';
    this.contentGrid.style.visibility = 'hidden';
  this.isProjectOpen = true;
  
  // Обновляем данные проекта
  this.updateProjectData(cardImage.src, cardTitle);
  
  // СПЕЦИАЛЬНЫЕ СЛУЧАИ ДЛЯ ПРОЕКТОВ
  if (cardTitle === 'mindplug') {
    this.setupMindplugProject();
  } else if (cardTitle === 'song poster') {
    this.setupSongPosterProject();
  } else if (cardTitle === 'vintage') {
    this.setupVintageProject();
  } else if (cardTitle === 'music zine') {
    this.setupMusicZineProject();
  } else if (cardTitle === 'terracotta') {
    this.setupTerracottaProject();
  } else if (cardTitle === 'a calendar for korean laboring folks') {
    this.setupCalendarProject();
  } else {
    this.setupRegularProject();
  }
  
  // Обновляем позицию кнопки после загрузки контента
  setTimeout(() => {
    this.updateButtonPosition();
  }, 50);
}

closeProject() {
  // Сбрасываем специальные настройки для специальных проектов
  if (this.projectContent.classList.contains('mindplug-project')) {
    this.setupRegularProject();
    this.projectContent.classList.remove('mindplug-project');
  }
  
  if (this.projectContent.classList.contains('song-poster-project')) {
    this.setupRegularProject();
    this.projectContent.classList.remove('song-poster-project');
  }
  
  if (this.projectContent.classList.contains('vintage-project')) {
    this.setupRegularProject();
    this.projectContent.classList.remove('vintage-project');
  }
  
  if (this.projectContent.classList.contains('music-zine-project')) {
    this.setupRegularProject();
    this.projectContent.classList.remove('music-zine-project');
  }
  
  if (this.projectContent.classList.contains('terracotta-project')) {
    this.setupRegularProject();
    this.projectContent.classList.remove('terracotta-project');
  }

  if (this.projectContent.classList.contains('calendar-project')) {
    this.setupRegularProject();
    this.projectContent.classList.remove('calendar-project');
  }
  
  // Скрываем проект, показываем карточки
  this.projectContent.classList.remove('active');
  this.contentGrid.style.opacity = '1';
  this.contentGrid.style.visibility = 'visible';
  this.isProjectOpen = false;
  
  // Возвращаем скролл в начало
  this.contentGrid.scrollTop = 0;
  
  // Восстанавливаем автоскролл через секунду
  setTimeout(() => {
    if (window.smoothCursorInstance && !window.smoothCursorInstance.userHasScrolled) {
      window.smoothCursorInstance.autoScrollEnabled = true;
    }
  }, 1000);
}

setupCalendarProject() {
  // Добавляем специальный класс для проекта calendar
  this.projectContent.classList.add('calendar-project');
  
  // Получаем основные контейнеры
  const leftColumn = this.projectContent.querySelector('.project-left-column');
  const largeImgContainer = this.projectContent.querySelector('.project-large-img');
  const projectWrapper = this.projectContent.querySelector('.project-wrapper');
  const bottomContainer = this.projectContent.querySelector('.project-bottom-container');
  const projectTextBlock = document.querySelector('.project-text-block');
  const morePhotos = this.projectContent.querySelector('.more-photos');
  const projectGoBack = this.projectContent.querySelector('.project-go-back');
  
  // Сохраняем исходный HTML на случай возврата
  if (projectWrapper && !projectWrapper.dataset.originalHtml) {
    projectWrapper.dataset.originalHtml = projectWrapper.innerHTML;
  }
  
  leftColumn.dataset.originalHtml = leftColumn.innerHTML;
  largeImgContainer.dataset.originalHtml = largeImgContainer.innerHTML;
  projectTextBlock.dataset.originalDisplay = projectTextBlock.style.display;
  morePhotos.dataset.originalText = morePhotos.innerHTML;
  bottomContainer.dataset.originalDisplay = bottomContainer.style.display;
  
  // СОЗДАЕМ ВИДЕО ВМЕСТО БОЛЬШОГО ИЗОБРАЖЕНИЯ
  const videoContainer = document.createElement('div');
  videoContainer.className = 'calendar-video-container';
  videoContainer.style.width = '100%';
  videoContainer.style.height = '100%';
  videoContainer.style.overflow = 'hidden';
  
  const video = document.createElement('video');
  video.src = 'assets/images/calendar.mp4';
  video.alt = 'Calendar for Korean laboring folks animation';
  video.style.width = '100%';
  video.style.height = '100%';
  video.style.objectFit = 'cover';
  video.style.display = 'block';
  video.loop = true;
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;
  video.currentTime = 0;
  
  videoContainer.appendChild(video);
  
  // Заменяем большое изображение на видео
  largeImgContainer.innerHTML = '';
  largeImgContainer.appendChild(videoContainer);
  
  // ВИДИМ ТОЛЬКО 2 МАЛЕНЬКИЕ ФОТОГРАФИИ
  const smallImages = leftColumn.querySelectorAll('.project-small-img');
  
  // Удаляем все маленькие изображения кроме первых двух
  for (let i = smallImages.length - 1; i >= 2; i--) {
    smallImages[i].remove();
  }
  
  // Обновляем существующие 2 маленькие изображения
  const updatedSmallImages = leftColumn.querySelectorAll('.project-small-img img');
  if (updatedSmallImages.length >= 2) {
    updatedSmallImages[0].src = 'assets/images/calendar_small_1.jpg';
    updatedSmallImages[0].alt = 'Calendar detail 1';
    
    updatedSmallImages[1].src = 'assets/images/calendar_small_2.jpg';
    updatedSmallImages[1].alt = 'Calendar detail 2';
  }
  
  // Обновляем текст кнопки "more photos"
  if (morePhotos) {
    const span = morePhotos.querySelector('span');
    if (span) {
      span.textContent = '4 more photos'; // Всего 6 фото: 2 маленьких показано + 4 в галерее
    } else {
      morePhotos.innerHTML = '<span>4 more photos</span>';
    }
  }
  
  // ПОКАЗЫВАЕМ текстовый блок
  projectTextBlock.style.display = 'block';
  
  // Скрываем нижний контейнер (кнопки будут позиционироваться отдельно)
  bottomContainer.style.display = 'none';
  
  // Перемещаем кнопки из нижнего контейнера прямо в project-wrapper
  morePhotos.parentNode.removeChild(morePhotos);
  projectGoBack.parentNode.removeChild(projectGoBack);
  
  // Добавляем обратно в project-wrapper
  projectWrapper.appendChild(morePhotos);
  projectWrapper.appendChild(projectGoBack);
  
  // Устанавливаем абсолютное позиционирование для десктопной версии
  if (window.innerWidth > 767) {
    projectWrapper.style.position = 'relative';
    
    // Стили для "4 more photos"
    morePhotos.style.position = 'absolute';
    morePhotos.style.left = '0';
    morePhotos.style.top = '595px'; // Высота видео
    morePhotos.style.marginTop = '32px';
    morePhotos.style.zIndex = '2';
    
    // Стили для "go back"
    projectGoBack.style.position = 'absolute';
    projectGoBack.style.left = '247px'; // 235px + 12px - начало видео
    projectGoBack.style.top = '607px'; // 595px + 32px + 12px
    projectGoBack.style.marginTop = '0';
    projectGoBack.style.zIndex = '2';
  }
  
  // Для адаптивности на мобильных
  this.adaptCalendarForMobile();
}

// Добавляем метод адаптации для calendar:
adaptCalendarForMobile() {
  const projectWrapper = this.projectContent.querySelector('.project-wrapper');
  const morePhotos = this.projectContent.querySelector('.more-photos');
  const projectGoBack = this.projectContent.querySelector('.project-go-back');
  
  if (window.innerWidth <= 767) {
    // На мобильных - флекс-контейнер для кнопок
    if (projectWrapper) {
      projectWrapper.style.position = 'static';
    }
    
    if (morePhotos) {
      morePhotos.style.cssText = '';
      morePhotos.style.marginTop = '20px';
      morePhotos.style.order = '1';
      morePhotos.style.alignSelf = 'flex-start';
    }
    
    if (projectGoBack) {
      projectGoBack.style.cssText = '';
      projectGoBack.style.marginTop = '12px';
      projectGoBack.style.order = '2';
      projectGoBack.style.alignSelf = 'flex-start';
    }
  } else {
    if (projectWrapper) {
      projectWrapper.style.position = 'relative';
    }
  }
}

// Добавляем новый метод для проекта terracotta:
setupTerracottaProject() {
  // Добавляем специальный класс для проекта terracotta
  this.projectContent.classList.add('terracotta-project');
  
  // Получаем контейнер для левой колонки
  const leftColumn = this.projectContent.querySelector('.project-left-column');
  const largeImgContainer = this.projectContent.querySelector('.project-large-img');
  const projectWrapper = this.projectContent.querySelector('.project-wrapper');
  
  // Сохраняем исходный HTML на случай возврата
  if (projectWrapper && !projectWrapper.dataset.originalHtml) {
    projectWrapper.dataset.originalHtml = projectWrapper.innerHTML;
  }
  
  leftColumn.dataset.originalHtml = leftColumn.innerHTML;
  largeImgContainer.dataset.originalHtml = largeImgContainer.innerHTML;
  
  // Очищаем левую колонку и делаем её контейнером для видео
  leftColumn.innerHTML = '';
  leftColumn.style.gridColumn = '1 / span 3';
  leftColumn.style.width = '977px';
  leftColumn.style.height = '595px';
  
  const videoContainer = document.createElement('div');
  videoContainer.className = 'project-video-container';
  videoContainer.style.width = '100%';
  videoContainer.style.height = '100%';
  videoContainer.style.overflow = 'hidden';
  
  // Создаем видео элемент
  const video = document.createElement('video');
  video.src = 'assets/images/terracotta.mp4'; // Путь к видео
  video.alt = 'Terracotta pottery studio website';
  video.style.width = '100%';
  video.style.height = '100%';
  video.style.objectFit = 'cover';
  video.style.display = 'block';
  video.loop = true;
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;
  video.currentTime = 0;
  
  videoContainer.appendChild(video);
  leftColumn.appendChild(videoContainer);
  
  // Скрываем правую колонку с большим изображением
  largeImgContainer.style.display = 'none';
  
  // Скрываем кнопку "12 more photos"
  const morePhotos = this.projectContent.querySelector('.more-photos');
  if (morePhotos) morePhotos.style.display = 'none';
  
  // Для адаптивности на мобильных
  this.adaptTerracottaForMobile();
}

// Добавляем метод адаптации для terracotta:
adaptTerracottaForMobile() {
  // На мобильных устройствах адаптируем видео
  if (window.innerWidth <= 767) {
    const leftColumn = this.projectContent.querySelector('.project-left-column');
    if (leftColumn) {
      leftColumn.style.gridColumn = '1';
      leftColumn.style.width = '100%';
      leftColumn.style.height = 'auto';
      leftColumn.style.aspectRatio = '977 / 595';
    }
  }
}

  setupMusicZineProject() {
    // Добавляем специальный класс для проекта music zine
    this.projectContent.classList.add('music-zine-project');
    
    // Получаем основные контейнеры
    const leftColumn = this.projectContent.querySelector('.project-left-column');
    const largeImgContainer = this.projectContent.querySelector('.project-large-img');
    const projectWrapper = this.projectContent.querySelector('.project-wrapper');
    const bottomContainer = this.projectContent.querySelector('.project-bottom-container');
    const projectTextBlock = this.projectContent.querySelector('.project-text-block');
    const morePhotos = this.projectContent.querySelector('.more-photos');
    const projectGoBack = this.projectContent.querySelector('.project-go-back');
    
    // Сохраняем исходный HTML на случай возврата
    if (projectWrapper && !projectWrapper.dataset.originalHtml) {
      projectWrapper.dataset.originalHtml = projectWrapper.innerHTML;
    }
    
    leftColumn.dataset.originalHtml = leftColumn.innerHTML;
    largeImgContainer.dataset.originalHtml = largeImgContainer.innerHTML;
    projectTextBlock.dataset.originalDisplay = projectTextBlock.style.display;
    morePhotos.dataset.originalText = morePhotos.innerHTML;
    bottomContainer.dataset.originalDisplay = bottomContainer.style.display;
    
    // Обновляем БОЛЬШОЕ изображение (zine_1)
    const largeImage = largeImgContainer.querySelector('img');
    if (largeImage) {
      largeImage.src = 'assets/images/zine_1.jpg';
      largeImage.alt = 'Music zine main cover';
    }
    
    // Обновляем МАЛЕНЬКИЕ изображения (zine_2 и zine_3)
    const smallImages = leftColumn.querySelectorAll('.project-small-img img');
    if (smallImages.length >= 2) {
      smallImages[0].src = 'assets/images/zine_2.jpg';
      smallImages[0].alt = 'Music zine spread 1';
      
      smallImages[1].src = 'assets/images/zine_3.jpg';
      smallImages[1].alt = 'Music zine spread 2';
    }
    
    // Обновляем текст кнопки "more photos"
    if (morePhotos) {
      const span = morePhotos.querySelector('span');
      if (span) {
        span.textContent = '6 more photos';
      } else {
        morePhotos.innerHTML = '<span>6 more photos</span>';
      }
    }
    
    // Скрываем текстовый блок и нижний контейнер
    projectTextBlock.style.display = 'none';
    bottomContainer.style.display = 'none';
    
    // Перемещаем кнопки из нижнего контейнера прямо в project-wrapper
    // Сначала удаляем их из текущих родителей
    morePhotos.parentNode.removeChild(morePhotos);
    projectGoBack.parentNode.removeChild(projectGoBack);
    
    // Добавляем обратно в project-wrapper
    projectWrapper.appendChild(morePhotos);
    projectWrapper.appendChild(projectGoBack);
    
    // Устанавливаем абсолютное позиционирование для десктопной версии
    if (window.innerWidth > 767) {
      projectWrapper.style.position = 'relative'; // Для абсолютного позиционирования кнопок
      
      // Стили для "6 more photos"
      morePhotos.style.position = 'absolute';
      morePhotos.style.left = '0';
      morePhotos.style.top = '627px'; // 595px (высота фото) + 32px (отступ)
      morePhotos.style.marginTop = '0';
      morePhotos.style.zIndex = '2';
      
      // Стили для "go back"
      projectGoBack.style.position = 'absolute';
      projectGoBack.style.left = '247px'; // 235px + 12px
      projectGoBack.style.top = '639px'; // 595px + 32px + 12px
      projectGoBack.style.marginTop = '0';
      projectGoBack.style.zIndex = '2';
    }
    
    // Для адаптивности на мобильных
    this.adaptMusicZineForMobile();
  }
  
  // Обновляем метод адаптации для music zine:
  adaptMusicZineForMobile() {
    const projectWrapper = this.projectContent.querySelector('.project-wrapper');
    const morePhotos = this.projectContent.querySelector('.more-photos');
    const projectGoBack = this.projectContent.querySelector('.project-go-back');
    
    if (window.innerWidth <= 767) {
      // На мобильных - флекс-контейнер для кнопок
      if (projectWrapper) {
        projectWrapper.style.position = 'static';
      }
      
      if (morePhotos) {
        morePhotos.style.cssText = ''; // Сбрасываем все стили
        morePhotos.style.marginTop = '20px';
        morePhotos.style.order = '1';
        morePhotos.style.alignSelf = 'flex-start';
      }
      
      if (projectGoBack) {
        projectGoBack.style.cssText = ''; // Сбрасываем все стили
        projectGoBack.style.marginTop = '12px';
        projectGoBack.style.order = '2';
        projectGoBack.style.alignSelf = 'flex-start';
      }
    } else {
      // На десктопе - абсолютное позиционирование
      if (projectWrapper) {
        projectWrapper.style.position = 'relative';
      }
    }
  }
  
  setupMindplugProject() {
    // Добавляем специальный класс для проекта mindplug
    this.projectContent.classList.add('mindplug-project');
    
    // Получаем контейнер для левой колонки
    const leftColumn = this.projectContent.querySelector('.project-left-column');
    const largeImgContainer = this.projectContent.querySelector('.project-large-img');
    const projectWrapper = this.projectContent.querySelector('.project-wrapper');
    
    // Сохраняем исходный HTML на случай возврата
    if (projectWrapper && !projectWrapper.dataset.originalHtml) {
      projectWrapper.dataset.originalHtml = projectWrapper.innerHTML;
    }
    
    leftColumn.dataset.originalHtml = leftColumn.innerHTML;
    largeImgContainer.dataset.originalHtml = largeImgContainer.innerHTML;
    
    // Очищаем левую колонку и делаем её контейнером для видео
    leftColumn.innerHTML = '';
    leftColumn.style.gridColumn = '1 / span 3';
    leftColumn.style.width = '977px';
    leftColumn.style.height = '595px';
    
    const videoContainer = document.createElement('div');
    videoContainer.className = 'project-video-container';
    videoContainer.style.width = '100%';
    videoContainer.style.height = '100%';
    videoContainer.style.overflow = 'hidden';
    
    // СОЗДАЕМ ВИДЕО ЭЛЕМЕНТ ВМЕСТО IMG
    const video = document.createElement('video');
    video.src = 'assets/images/mindplug.mp4'; // Меняем .gif на .mp4
    video.alt = 'Mindplug project animation';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    video.style.display = 'block';
    video.loop = true; // Зацикливание
    video.muted = true; // Без звука
    video.autoplay = true; // Автовоспроизведение
    video.playsInline = true; // Для iOS
    video.currentTime = 0; // Начинаем с начала
    
    videoContainer.appendChild(video);
    leftColumn.appendChild(videoContainer);
    
    // Скрываем правую колонку с большим изображением
    largeImgContainer.style.display = 'none';
    
    // Скрываем кнопку "12 more photos"
    const morePhotos = this.projectContent.querySelector('.more-photos');
    if (morePhotos) morePhotos.style.display = 'none';
    
    // Для адаптивности на мобильных
    this.adaptMindplugForMobile();
  }
  
  setupSongPosterProject() {
   // Добавляем специальный класс для проекта song poster
   this.projectContent.classList.add('song-poster-project');
  
   // Получаем основные контейнеры
   const leftColumn = this.projectContent.querySelector('.project-left-column');
   const largeImgContainer = this.projectContent.querySelector('.project-large-img');
   const projectWrapper = this.projectContent.querySelector('.project-wrapper');
   const bottomContainer = this.projectContent.querySelector('.project-bottom-container');
   
   // ВАЖНО: Сохраняем исходный HTML перед изменением
   if (projectWrapper && !projectWrapper.dataset.originalHtml) {
     projectWrapper.dataset.originalHtml = projectWrapper.innerHTML;
   }
   
   // Сохраняем исходный HTML на случай возврата
   leftColumn.dataset.originalHtml = leftColumn.innerHTML;
   largeImgContainer.dataset.originalHtml = largeImgContainer.innerHTML;
   projectWrapper.dataset.originalDisplay = projectWrapper.style.display;
   bottomContainer.dataset.originalDisplay = bottomContainer.style.display;
   
    // Очищаем все и создаем новую структуру
    projectWrapper.innerHTML = '';
    projectWrapper.style.display = 'flex';
    projectWrapper.style.flexDirection = 'column';
    projectWrapper.style.alignItems = 'flex-end'; /* Прибиваем к правому краю */
    projectWrapper.style.justifyContent = 'flex-start';
    projectWrapper.style.width = '100%';
    projectWrapper.style.height = '100%';
    projectWrapper.style.position = 'relative';
    
    // Создаем контейнер для гифки
    const gifContainer = document.createElement('div');
    gifContainer.className = 'song-poster-gif-container';
    gifContainer.style.width = '443px';
    gifContainer.style.height = '627px';
    gifContainer.style.overflow = 'hidden';
    gifContainer.style.marginLeft = 'auto'; /* Прибиваем к правому краю */
    
    // Создаем изображение для гифки
    const gifImage = document.createElement('img');
    gifImage.src = 'assets/images/song-poster.gif'; // Укажите путь к гифке
    gifImage.alt = 'Song poster animation';
    gifImage.style.width = '100%';
    gifImage.style.height = '100%';
    gifImage.style.objectFit = 'cover';
    gifImage.style.display = 'block';
    
    gifContainer.appendChild(gifImage);
    projectWrapper.appendChild(gifContainer);
    
    // Создаем контейнер для кнопки go back
    const goBackContainer = document.createElement('div');
    goBackContainer.className = 'song-poster-go-back-container';
    goBackContainer.style.marginTop = '32px';
    goBackContainer.style.marginLeft = 'auto'; /* Выравниваем по правому краю */
    goBackContainer.style.width = '443px'; /* Та же ширина что и у гифки */
    goBackContainer.style.display = 'flex';
    goBackContainer.style.justifyContent = 'flex-start'; /* Кнопка слева внутри контейнера */
    
    // Копируем кнопку go back
    const goBackBtn = this.goBackBtn.cloneNode(true);
    goBackBtn.style.position = 'static';
    goBackBtn.style.transform = 'none';
    goBackBtn.style.margin = '0';
    
    // Удаляем старый обработчик и добавляем новый
    const newGoBackBtn = goBackBtn.querySelector('.project-go-back') || goBackBtn;
    newGoBackBtn.onclick = null;
    newGoBackBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.closeProject();
    });
    
    goBackContainer.appendChild(newGoBackBtn);
    projectWrapper.appendChild(goBackContainer);
    
    // Скрываем обычные элементы
    bottomContainer.style.display = 'none';
    
    // Для адаптивности на мобильных
    this.adaptSongPosterForMobile();
  }

  setupVintageProject() {
    // Добавляем специальный класс для проекта vintage
    this.projectContent.classList.add('vintage-project');
    
    // Получаем контейнер для левой колонки
    const leftColumn = this.projectContent.querySelector('.project-left-column');
    const largeImgContainer = this.projectContent.querySelector('.project-large-img');
    const projectWrapper = this.projectContent.querySelector('.project-wrapper');
    
    // Сохраняем исходный HTML на случай возврата
    if (projectWrapper && !projectWrapper.dataset.originalHtml) {
      projectWrapper.dataset.originalHtml = projectWrapper.innerHTML;
    }
    
    leftColumn.dataset.originalHtml = leftColumn.innerHTML;
    largeImgContainer.dataset.originalHtml = largeImgContainer.innerHTML;
    
    // Очищаем левую колонку и делаем её контейнером для большой гифки
    leftColumn.innerHTML = '';
    leftColumn.style.gridColumn = '1 / span 3'; // Занимает все 3 колонки (235 + 12 + 730 = 977px)
    leftColumn.style.width = '977px';
    leftColumn.style.height = '595px';
    
    const gifContainer = document.createElement('div');
    gifContainer.className = 'project-gif-container vintage-gif-container';
    gifContainer.style.width = '100%';
    gifContainer.style.height = '100%';
    gifContainer.style.overflow = 'hidden';
    
    const video = document.createElement('video');
    video.src = 'assets/images/vintage.mp4'; // Измените путь на ваш mp4 файл
    video.alt = 'Vintage app interface animation';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    video.style.display = 'block';
    video.loop = true; // Зацикливание
    video.muted = true; // Без звука
    video.autoplay = true; // Автовоспроизведение
    video.playsInline = true; // Для iOS
    
    gifContainer.appendChild(video); // Заменяем gifImage на video
    leftColumn.appendChild(gifContainer);
    
    // Скрываем правую колонку с большим изображением
    largeImgContainer.style.display = 'none';
    
    // Скрываем кнопку "12 more photos"
    const morePhotos = this.projectContent.querySelector('.more-photos');
    if (morePhotos) morePhotos.style.display = 'none';
    
    // Для адаптивности на мобильных
    this.adaptVintageForMobile();
  }
  
  // Добавляем метод адаптации для vintage:
  adaptVintageForMobile() {
    // На мобильных устройствах адаптируем гифку
    if (window.innerWidth <= 767) {
      const leftColumn = this.projectContent.querySelector('.project-left-column');
      if (leftColumn) {
        leftColumn.style.gridColumn = '1';
        leftColumn.style.width = '100%';
        leftColumn.style.height = 'auto';
        leftColumn.style.aspectRatio = '977 / 595';
      }
    }
  }
  
  setupRegularProject() {
    // Убираем классы специальных проектов
    this.projectContent.classList.remove('mindplug-project', 'song-poster-project', 'vintage-project', 'music-zine-project', 'terracotta-project');
    
    // Полностью восстанавливаем оригинальную структуру
    const projectWrapper = this.projectContent.querySelector('.project-wrapper');
    const bottomContainer = this.projectContent.querySelector('.project-bottom-container');
    const projectTextBlock = this.projectContent.querySelector('.project-text-block');
    const morePhotos = this.projectContent.querySelector('.more-photos');
    const projectGoBack = this.projectContent.querySelector('.project-go-back');
    
    // Восстанавливаем оригинальную структуру wrapper
    if (projectWrapper && projectWrapper.dataset.originalHtml) {
      projectWrapper.innerHTML = projectWrapper.dataset.originalHtml;
    }
    
    // Восстанавливаем нижний контейнер
    if (bottomContainer) {
      bottomContainer.style.cssText = ''; // Сбрасываем все стили
    }
    
    // Восстанавливаем текстовый блок
    if (projectTextBlock && projectTextBlock.dataset.originalDisplay) {
      projectTextBlock.style.display = projectTextBlock.dataset.originalDisplay;
    }
    
    // Восстанавливаем кнопку "more photos"
    if (morePhotos && morePhotos.dataset.originalText) {
      morePhotos.innerHTML = morePhotos.dataset.originalText;
    }

      // Сбрасываем позиционирование
  if (projectWrapper) {
    projectWrapper.style.position = '';
  }
    
    // Восстанавливаем позицию кнопки "go back"
    if (projectGoBack) {
      projectGoBack.style.cssText = '';
    }
    
    // Восстанавливаем обработчик кнопки go back
    const restoredGoBackBtn = projectWrapper.querySelector('.project-go-back');
    if (restoredGoBackBtn) {
      restoredGoBackBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeProject();
      });
    }
    
    // Сбрасываем адаптацию для мобильных
    this.resetMobileAdaptation();
  }
  
  
  adaptMindplugForMobile() {
    // На мобильных устройствах адаптируем гифку
    if (window.innerWidth <= 767) {
      const leftColumn = this.projectContent.querySelector('.project-left-column');
      if (leftColumn) {
        leftColumn.style.gridColumn = '1';
        leftColumn.style.width = '100%';
        leftColumn.style.height = 'auto';
        leftColumn.style.aspectRatio = '977 / 595';
      }
    }
  }
  
  adaptSongPosterForMobile() {
    if (window.innerWidth <= 767) {
      const projectWrapper = this.projectContent.querySelector('.project-wrapper');
      const gifContainer = this.projectContent.querySelector('.song-poster-gif-container');
      const goBackContainer = this.projectContent.querySelector('.song-poster-go-back-container');
      
      if (projectWrapper) {
        projectWrapper.style.alignItems = 'center'; /* Центрируем на мобильных */
      }
      
      if (gifContainer) {
        gifContainer.style.width = '100%';
        gifContainer.style.height = 'auto';
        gifContainer.style.aspectRatio = '443 / 627';
        gifContainer.style.marginLeft = '0';
      }
      
      if (goBackContainer) {
        goBackContainer.style.width = '100%';
        goBackContainer.style.marginLeft = '0';
        goBackContainer.style.justifyContent = 'flex-start';
      }
    }
  }
  
  resetMobileAdaptation() {
    // Не нужно для обычного проекта
  }
  
  updateProjectData(imageSrc, title) {
    const projectText = document.querySelector('.project-text-block p');
    
  // Специальный текст для calendar
  if (title === 'a calendar for korean laboring folks') {
    if (projectText) {
      projectText.innerHTML = `
        <strong>A calendar for Korean laboring folks</strong> — календарь для корейских работяг с акцентом на выходные и гос. праздники. в комплект идет пак наклеек для внеплановых выходных.
        <br><br>
        ода не сочетающимся цветам и съехавшей типографике, обусловленные азиатским контекстом.
      `;
    }
    return;
  }

    // Специальный текст для song poster
    if (title === 'song poster') {
      return; // Выходим раньше, не обновляем обычные изображения
    }

        // Специальный текст для vintage
        if (title === 'vintage') {
          if (projectText) {
            projectText.innerHTML = `
              приложение-гид по винтажному сообществу. здесь пользователь узнает о главных новостях и фактах, совершает сделки, записывается на аукционы и отслеживает свой прогресс продвижения в винтажной культуре.
            `;
          }
          return; // Выходим раньше
        }
    
    // Специальный текст для mindplug
    if (title === 'mindplug') {
      if (projectText) {
        projectText.innerHTML = `
          <a href="https://caesarusss.github.io/poster_code/">website link</a>
          <br>
          <br> mindplug — радио, проигрывающее разноформатные звуки. помогает людям <br> с силенсофобией и бессонницей. сайт раскрывает айдентику продукта.
        `;
      }
      return; // Выходим раньше
    }

    // Специальный текст для terracotta
    if (title === 'terracotta') {
      if (projectText) {
        projectText.innerHTML = `
          <a href="https://www.figma.com/proto/RIplRLIAGAqrtVNZv0URjJ/terracotta?node-id=1-11&t=zYa2wHKGLHNnCxqJ-1&scaling=scale-down&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=1%3A11">prototype link</a>
          <br>
          <br> сайт для уютной гончарной мастерской.
        `;
      }
      return;
    }
    
        // Специальный текст для music zine
        if (title === 'music zine') {
          return; // Выходим раньше
        }
    
    // Обычный текст для других проектов
    if (projectText) {
      const texts = [
        `<strong>${title}</strong> — some text about the project. some text about the project. some text about the project. some text about the project. some text about the project. some text about the project. some text about the project. some text about the project. some text about the project. some text about the project. some text about the project. some text about the project. some text about the project. some text about the project. some text about the project. some text about the project. some text about the project. some text about the project. some text about the project. some text about the project. some text about the project. some text about the project. some text about the project. some text about the project. some text about the project.  some text about the project. some text about the project.`,
      ];
      
      // Берем случайный текст разной длины
      const randomText = texts[Math.floor(Math.random() * texts.length)];
      projectText.innerHTML = randomText;
    }
    
    if (title !== 'mindplug' && title !== 'song poster' && title !== 'vintage' && 
      title !== 'music zine' && title !== 'terracotta' && 
      title !== 'a calendar for korean laboring folks') {
    const mainImage = document.querySelector('.project-large-img img');
    if (mainImage) {
      mainImage.src = imageSrc;
    }
  }
}
  
  updateButtonPosition() {
    // Кнопка уже правильно позиционирована через CSS Grid
  }
}

// Инициализация после загрузки страницы
document.addEventListener('DOMContentLoaded', () => {
  // Ждем завершения прелоадера
  setTimeout(() => {
    new ProjectView();
  }, 1000);
});

if (document.readyState === 'complete') {
  new ProjectView();
}

class SimpleGallery {
  constructor() {
      this.overlay = document.querySelector('.gallery-overlay');
      this.content = document.querySelector('.gallery-content');
      this.counter = document.querySelector('.gallery-counter');
      
      this.images = [];
      this.currentIndex = 0;
      
      this.init();
  }
  
  init() {
    this.collectImages();
    this.setupOpenTriggers();
    this.setupControls();
    
    // Простой обработчик закрытия по клику на overlay
    this.overlay.addEventListener('click', (e) => {
      // Закрываем всегда, кроме случаев когда кликнули на стрелки
      if (!e.target.classList.contains('gallery-arrow')) {
        this.close();
      }
    });
    
    // Для специальных проектов отключаем галерею
    this.disableGalleryForSpecialProjects();
  }
  
  collectImages() {
    
    // Проверяем, открыт ли проект music zine
    const projectContent = document.querySelector('.project-content');
    const isMusicZine = projectContent && projectContent.classList.contains('music-zine-project');
    
    if (isMusicZine) {
      // Для music zine собираем свои изображения
      this.images = [];
      
      // Большое изображение
      const mainImg = document.querySelector('.project-large-img img');
      if (mainImg) this.images.push(mainImg.src); // zine_1
      
      // Маленькие изображения
      document.querySelectorAll('.project-small-img img').forEach(img => {
        this.images.push(img.src); // zine_2 и zine_3
      });
      
      // Дополнительные изображения для music zine (9 фото всего: 3 видимых + 6 скрытых)
      // Но текст говорит "5 more photos", значит показываем 3 фото, а скрытых 6
      for (let i = 4; i <= 9; i++) { // Изменено с 8 на 9
        this.images.push(`assets/images/zine_${i}.jpg`);
      }
    } else {
      // Для обычных проектов - стандартная логика
      const mainImg = document.querySelector('.project-large-img img');
      if (mainImg) this.images.push(mainImg.src);
      
      document.querySelectorAll('.project-small-img img').forEach(img => {
        this.images.push(img.src);
      });

       // Проверяем, открыт ли проект calendar
  const projectContent = document.querySelector('.project-content');
  const isCalendar = projectContent && projectContent.classList.contains('calendar-project');
  
  if (isCalendar) {
    // Для calendar собираем свои изображения
    this.images = [];
    
    // Видео (первое в галерее)
    this.images.push('assets/images/calendar.mp4');
    
    // 2 видимых маленьких фото
    const smallImgs = document.querySelectorAll('.project-small-img img');
    smallImgs.forEach(img => {
      this.images.push(img.src);
    });
    
    // 4 дополнительные фото в галерее
    for (let i = 3; i <= 6; i++) {
      this.images.push(`assets/images/calendar_small_${i}.jpg`);
    }
  }
      
      // Дополнительные изображения (симуляция)
      for (let i = 3; i <= 12; i++) {
        const colors = [
          '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
          '#ffeaa7', '#fab1a0', '#a29bfe', '#fd79a8',
          '#55efc4', '#81ecec', '#74b9ff', '#dfe6e9'
        ];
        this.images.push(`https://via.placeholder.com/800x600/${colors[i-1].substring(1)}/ffffff?text=Project+${i}`);
      }
    }
  }
  
  setupOpenTriggers() {
      // Большое изображение
      const largeImgContainer = document.querySelector('.project-large-img');
      if (largeImgContainer) {
          largeImgContainer.style.cursor = 'pointer';
          largeImgContainer.addEventListener('click', () => this.open(0));
      }
      
      // Маленькие изображения
      document.querySelectorAll('.project-small-img').forEach((el, i) => {
          el.style.cursor = 'pointer';
          el.addEventListener('click', () => this.open(i + 1));
      });
      
      // Кнопка "12 more photos"
      const moreBtn = document.querySelector('.more-photos');
      if (moreBtn) {
          moreBtn.addEventListener('click', (e) => {
              e.preventDefault();
              this.open(0);
          });
      }
  }
  disableGalleryForSpecialProjects() {
    // Если специальный проект открыт, отключаем клики по изображениям
    const checkForSpecialProjects = () => {
      const projectContent = document.querySelector('.project-content');
      // ОСТАВЛЯЕМ только те проекты, где галерея НЕ нужна
      if (projectContent && (
        projectContent.classList.contains('mindplug-project') || 
        projectContent.classList.contains('song-poster-project') ||
        projectContent.classList.contains('terracotta-project') ||
        projectContent.classList.contains('vintage-project')
        // НЕ включаем music-zine-project - там галерея должна работать
      )) {
        const largeImgContainer = document.querySelector('.project-large-img');
        const smallImgs = document.querySelectorAll('.project-small-img');
        const moreBtn = document.querySelector('.more-photos');
        
        if (largeImgContainer) {
          largeImgContainer.style.cursor = 'default';
          // Удаляем все обработчики путем замены элемента
          const newLargeImg = largeImgContainer.cloneNode(true);
          largeImgContainer.parentNode.replaceChild(newLargeImg, largeImgContainer);
        }
        
        smallImgs.forEach(el => {
          el.style.cursor = 'default';
          const newEl = el.cloneNode(true);
          el.parentNode.replaceChild(newEl, el);
        });
        
        if (moreBtn) {
          const newMoreBtn = moreBtn.cloneNode(true);
          moreBtn.parentNode.replaceChild(newMoreBtn, moreBtn);
        }
      }
    };
    
    setInterval(checkForSpecialProjects, 500);
  }
  
  setupControls() {
      // Предыдущее изображение
      const prevBtn = document.querySelector('.gallery-arrow.prev');
      prevBtn.addEventListener('click', (e) => {
          e.stopPropagation(); // Предотвращаем всплытие до overlay
          this.prev();
      });
      
      // Следующее изображение
      const nextBtn = document.querySelector('.gallery-arrow.next');
      nextBtn.addEventListener('click', (e) => {
          e.stopPropagation(); // Предотвращаем всплытие до overlay
          this.next();
      });
      
      // Клавиши клавиатуры
      document.addEventListener('keydown', (e) => {
          if (!this.overlay.classList.contains('active')) return;
          
          if (e.key === 'Escape') {
              this.close();
          } else if (e.key === 'ArrowLeft') {
              this.prev();
          } else if (e.key === 'ArrowRight') {
              this.next();
          }
      });
  }
  open(index = 0) {
    // Не открываем галерею ТОЛЬКО для тех проектов, где она не нужна
    const projectContent = document.querySelector('.project-content');
    if (projectContent && (
      projectContent.classList.contains('mindplug-project') || 
      projectContent.classList.contains('song-poster-project') ||
      projectContent.classList.contains('terracotta-project') ||
      projectContent.classList.contains('vintage-project')
      // НЕ включаем music-zine-project
    )) {
      return;
    }
    
    // Для music zine - обновляем список изображений перед открытием
    const isMusicZine = projectContent && projectContent.classList.contains('music-zine-project');
    if (isMusicZine) {
      this.collectImages(); // Пересобираем изображения для music zine
    }
    
    this.currentIndex = index;
    this.updateImage();
    this.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Скрыть кастомный курсор
    const cursor = document.querySelector('.custom-cursor');
    if (cursor) cursor.style.display = 'none';
  }
  
  close() {
      this.overlay.classList.remove('active');
      document.body.style.overflow = '';
      
      // Показать кастомный курсор
      const cursor = document.querySelector('.custom-cursor');
      if (cursor) {
          cursor.style.display = 'block';
          // Обновить позицию курсора
          setTimeout(() => {
              if (window.smoothCursorInstance) {
                  cursor.style.transform = `translate(${window.smoothCursorInstance.pos.x}px, ${window.smoothCursorInstance.pos.y}px)`;
              }
          }, 50);
      }
  }
  
  updateImage() {
      this.content.innerHTML = '';
      
      const img = document.createElement('img');
      img.src = this.images[this.currentIndex];
      img.alt = `Image ${this.currentIndex + 1}`;
      img.style.pointerEvents = 'none'; // На всякий случай
      
      this.content.appendChild(img);
      this.counter.textContent = `${this.currentIndex + 1}/${this.images.length}`;
  }
  
  prev() {
      this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.images.length - 1;
      this.updateImage();
  }
  
  next() {
      this.currentIndex = this.currentIndex < this.images.length - 1 ? this.currentIndex + 1 : 0;
      this.updateImage();
  }
}

// Запуск галереи
document.addEventListener('DOMContentLoaded', () => {
  window.gallery = new SimpleGallery();
  console.log('Gallery initialized');
});