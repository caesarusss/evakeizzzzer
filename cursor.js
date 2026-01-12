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
    
    this.specialProjects = {
      'mindplug': this.setupMindplugProject.bind(this),
      'song poster': this.setupSongPosterProject.bind(this),
      'vintage': this.setupVintageProject.bind(this),
      'music zine': this.setupMusicZineProject.bind(this),
      'terracotta': this.setupTerracottaProject.bind(this),
      'a calendar for korean laboring folks': this.setupCalendarProject.bind(this)
    };
    
    this.projectTexts = {
      'a calendar for korean laboring folks': `
        <strong>A calendar for Korean laboring folks</strong> — календарь для корейских работяг с акцентом на выходные и гос. праздники. в комплект идет пак наклеек для внеплановых выходных.
        <br><br>
        ода не сочетающимся цветам и съехавшей типографике, обусловленные азиатским контекстом.
      `,
      'song poster': null,
      'vintage': `
        приложение-гид по винтажному сообществу. здесь пользователь узнает о главных новостях и фактах, совершает сделки, записывается на аукционы и отслеживает свой прогресс продвижения в винтажной культуре.
      `,
      'mindplug': `
        <a href="https://caesarusss.github.io/poster_code/">website link</a>
        <br>
        <br> mindplug — радио, проигрывающее разноформатные звуки. помогает людям <br> с силенсофобией и бессонницей. сайт раскрывает айдентику продукта.
      `,
      'terracotta': `
        <a href="https://www.figma.com/proto/RIplRLIAGAqrtVNZv0URjJ/terracotta?node-id=1-11&t=zYa2wHKGLHNnCxqJ-1&scaling=scale-down&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=1%3A11">prototype link</a>
        <br>
        <br> сайт для уютной гончарной мастерской.
      `,
      'music zine': null
    };
    
    this.init();
  }
  
  init() {
    this.cards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (this.isProjectOpen) return;
        this.openProject(e);
      });
    });
    
    this.goBackBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.closeProject();
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isProjectOpen) {
        this.closeProject();
      }
    });
  }
  
  openProject(e) {
    const card = e.currentTarget;
    const cardImage = card.querySelector('img');
    const cardTitle = card.querySelector('.text').textContent.trim().toLowerCase();
    
    if (window.smoothCursorInstance) {
      window.smoothCursorInstance.autoScrollEnabled = false;
    }
    
    this.projectContent.classList.add('active');
    this.contentGrid.style.opacity = '0';
    this.contentGrid.style.visibility = 'hidden';
    this.isProjectOpen = true;
    
    this.updateProjectData(cardImage.src, cardTitle);
    
    // Определяем тип проекта
    if (this.specialProjects[cardTitle]) {
      this.specialProjects[cardTitle]();
    } else {
      this.setupRegularProject();
    }
    
    this.reinitializeGallery();
    setTimeout(() => this.updateButtonPosition(), 50);
  }
  
  closeProject() {
    const specialClasses = [
      'mindplug-project', 'song-poster-project', 'vintage-project',
      'music-zine-project', 'terracotta-project', 'calendar-project'
    ];
    
    specialClasses.forEach(className => {
      if (this.projectContent.classList.contains(className)) {
        this.setupRegularProject();
        this.projectContent.classList.remove(className);
      }
    });
    
    this.projectContent.classList.remove('active');
    this.contentGrid.style.opacity = '1';
    this.contentGrid.style.visibility = 'visible';
    this.isProjectOpen = false;
    this.contentGrid.scrollTop = 0;
    
    setTimeout(() => {
      if (window.smoothCursorInstance && !window.smoothCursorInstance.userHasScrolled) {
        window.smoothCursorInstance.autoScrollEnabled = true;
      }
    }, 1000);
  }
  
  setupCalendarProject() {
    this.projectContent.classList.add('calendar-project');
    
    const elements = this.getProjectElements();
    this.saveOriginalState(elements);
    
    // Создаем видео
    const videoContainer = this.createVideoContainer('assets/images/calendar.mp4', 'Calendar for Korean laboring folks animation');
    elements.largeImgContainer.innerHTML = '';
    elements.largeImgContainer.appendChild(videoContainer);
    
    // Оставляем только 2 маленьких фото
    this.limitSmallImages(elements.leftColumn, 2);
    this.updateSmallImages(elements.leftColumn, [
      { src: 'assets/images/calendar_small_1.jpg', alt: 'Calendar detail 1' },
      { src: 'assets/images/calendar_small_2.jpg', alt: 'Calendar detail 2' }
    ]);
    
    // Настраиваем интерфейс
    this.updateMorePhotosText(elements.morePhotos, '4 more photos');
    elements.projectTextBlock.style.display = 'block';
    elements.bottomContainer.style.display = 'none';
    
    this.repositionButtons(elements.projectWrapper, elements.morePhotos, elements.projectGoBack, 595);
    this.adaptCalendarForMobile(elements);
  }
  
  setupTerracottaProject() {
    this.projectContent.classList.add('terracotta-project');
    
    const elements = this.getProjectElements();
    this.saveOriginalState(elements);
    
    // Создаем видео в левой колонке
    const videoContainer = this.createVideoContainer('assets/images/terracotta.mp4', 'Terracotta pottery studio website');
    elements.leftColumn.innerHTML = '';
    elements.leftColumn.style.gridColumn = '1 / span 3';
    elements.leftColumn.style.width = '977px';
    elements.leftColumn.style.height = '595px';
    elements.leftColumn.appendChild(videoContainer);
    
    // Скрываем неиспользуемые элементы
    elements.largeImgContainer.style.display = 'none';
    if (elements.morePhotos) elements.morePhotos.style.display = 'none';
    
    this.adaptForMobile(elements.leftColumn, 'terracotta');
  }
  
  setupMusicZineProject() {
    this.projectContent.classList.add('music-zine-project');
    
    const elements = this.getProjectElements();
    this.saveOriginalState(elements);
    
    // Обновляем изображения
    this.updateLargeImage(elements.largeImgContainer, 'assets/images/zine_1.jpg', 'Music zine main cover');
    this.updateSmallImages(elements.leftColumn, [
      { src: 'assets/images/zine_2.jpg', alt: 'Music zine spread 1' },
      { src: 'assets/images/zine_3.jpg', alt: 'Music zine spread 2' }
    ]);
    
    // Настраиваем интерфейс
    this.updateMorePhotosText(elements.morePhotos, '6 more photos');
    elements.projectTextBlock.style.display = 'none';
    elements.bottomContainer.style.display = 'none';
    
    this.repositionButtons(elements.projectWrapper, elements.morePhotos, elements.projectGoBack, 595, 627);
    this.adaptMusicZineForMobile(elements);
  }
  
  setupMindplugProject() {
    this.projectContent.classList.add('mindplug-project');
    
    const elements = this.getProjectElements();
    this.saveOriginalState(elements);
    
    // Создаем видео в левой колонке
    const videoContainer = this.createVideoContainer('assets/images/mindplug.mp4', 'Mindplug project animation');
    elements.leftColumn.innerHTML = '';
    elements.leftColumn.style.gridColumn = '1 / span 3';
    elements.leftColumn.style.width = '977px';
    elements.leftColumn.style.height = '595px';
    elements.leftColumn.appendChild(videoContainer);
    
    // Скрываем неиспользуемые элементы
    elements.largeImgContainer.style.display = 'none';
    if (elements.morePhotos) elements.morePhotos.style.display = 'none';
    
    this.adaptForMobile(elements.leftColumn, 'mindplug');
  }
  
  setupSongPosterProject() {
    this.projectContent.classList.add('song-poster-project');
    
    const elements = this.getProjectElements();
    this.saveOriginalState(elements);
    
    // Очищаем и создаем новую структуру
    elements.projectWrapper.innerHTML = '';
    elements.projectWrapper.style.display = 'flex';
    elements.projectWrapper.style.flexDirection = 'column';
    elements.projectWrapper.style.alignItems = 'flex-end';
    elements.projectWrapper.style.justifyContent = 'flex-start';
    elements.projectWrapper.style.width = '100%';
    elements.projectWrapper.style.height = '100%';
    elements.projectWrapper.style.position = 'relative';
    
    // Создаем контейнер для GIF
    const gifContainer = this.createGifContainer('assets/images/song-poster.gif', 'Song poster animation', 443, 627);
    elements.projectWrapper.appendChild(gifContainer);
    
    // Кнопка возврата
    const goBackContainer = this.createGoBackContainer(443, 32);
    elements.projectWrapper.appendChild(goBackContainer);
    
    elements.bottomContainer.style.display = 'none';
    this.adaptSongPosterForMobile();
  }
  
  setupVintageProject() {
    this.projectContent.classList.add('vintage-project');
    
    const elements = this.getProjectElements();
    this.saveOriginalState(elements);
    
    // Создаем видео в левой колонке
    const videoContainer = this.createVideoContainer('assets/images/vintage.mp4', 'Vintage app interface animation');
    elements.leftColumn.innerHTML = '';
    elements.leftColumn.style.gridColumn = '1 / span 3';
    elements.leftColumn.style.width = '977px';
    elements.leftColumn.style.height = '595px';
    elements.leftColumn.appendChild(videoContainer);
    
    // Скрываем неиспользуемые элементы
    elements.largeImgContainer.style.display = 'none';
    if (elements.morePhotos) elements.morePhotos.style.display = 'none';
    
    this.adaptForMobile(elements.leftColumn, 'vintage');
  }
  
  setupRegularProject() {
    const specialClasses = [
      'mindplug-project', 'song-poster-project', 'vintage-project',
      'music-zine-project', 'terracotta-project', 'calendar-project'
    ];
    this.projectContent.classList.remove(...specialClasses);
    
    const elements = this.getProjectElements();
    
    // Восстанавливаем оригинальную структуру
    if (elements.projectWrapper && elements.projectWrapper.dataset.originalHtml) {
      elements.projectWrapper.innerHTML = elements.projectWrapper.dataset.originalHtml;
    }
    
    // Сбрасываем стили
    if (elements.bottomContainer) elements.bottomContainer.style.cssText = '';
    if (elements.projectTextBlock && elements.projectTextBlock.dataset.originalDisplay) {
      elements.projectTextBlock.style.display = elements.projectTextBlock.dataset.originalDisplay;
    }
    if (elements.morePhotos && elements.morePhotos.dataset.originalText) {
      elements.morePhotos.innerHTML = elements.morePhotos.dataset.originalText;
    }
    if (elements.projectWrapper) elements.projectWrapper.style.position = '';
    if (elements.projectGoBack) elements.projectGoBack.style.cssText = '';
    
    // Восстанавливаем обработчик
    const restoredGoBackBtn = elements.projectWrapper.querySelector('.project-go-back');
    if (restoredGoBackBtn) {
      restoredGoBackBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeProject();
      });
    }
    
    this.reinitializeGallery();
  }
  
  // Вспомогательные методы
  getProjectElements() {
    return {
      leftColumn: this.projectContent.querySelector('.project-left-column'),
      largeImgContainer: this.projectContent.querySelector('.project-large-img'),
      projectWrapper: this.projectContent.querySelector('.project-wrapper'),
      bottomContainer: this.projectContent.querySelector('.project-bottom-container'),
      projectTextBlock: this.projectContent.querySelector('.project-text-block'),
      morePhotos: this.projectContent.querySelector('.more-photos'),
      projectGoBack: this.projectContent.querySelector('.project-go-back')
    };
  }
  
  saveOriginalState(elements) {
    if (elements.projectWrapper && !elements.projectWrapper.dataset.originalHtml) {
      elements.projectWrapper.dataset.originalHtml = elements.projectWrapper.innerHTML;
    }
    
    Object.keys(elements).forEach(key => {
      if (elements[key] && !elements[key].dataset.originalHtml) {
        elements[key].dataset.originalHtml = elements[key].innerHTML;
      }
    });
  }
  
  createVideoContainer(src, alt) {
    const videoContainer = document.createElement('div');
    videoContainer.className = 'project-video-container';
    videoContainer.style.cssText = 'width: 100%; height: 100%; overflow: hidden;';
    
    const video = document.createElement('video');
    video.src = src;
    video.alt = alt;
    video.style.cssText = 'width: 100%; height: 100%; object-fit: cover; display: block;';
    video.loop = true;
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.currentTime = 0;
    
    videoContainer.appendChild(video);
    return videoContainer;
  }
  
  createGifContainer(src, alt, width, height) {
    const gifContainer = document.createElement('div');
    gifContainer.className = 'song-poster-gif-container';
    gifContainer.style.cssText = `width: ${width}px; height: ${height}px; overflow: hidden; margin-left: auto;`;
    
    const gifImage = document.createElement('img');
    gifImage.src = src;
    gifImage.alt = alt;
    gifImage.style.cssText = 'width: 100%; height: 100%; object-fit: cover; display: block;';
    
    gifContainer.appendChild(gifImage);
    return gifContainer;
  }
  
  createGoBackContainer(width, marginTop) {
    const goBackContainer = document.createElement('div');
    goBackContainer.className = 'song-poster-go-back-container';
    goBackContainer.style.cssText = `
      margin-top: ${marginTop}px;
      margin-left: auto;
      width: ${width}px;
      display: flex;
      justify-content: flex-start;
    `;
    
    const goBackBtn = this.goBackBtn.cloneNode(true);
    goBackBtn.style.cssText = 'position: static; transform: none; margin: 0;';
    
    const newGoBackBtn = goBackBtn.querySelector('.project-go-back') || goBackBtn;
    newGoBackBtn.onclick = null;
    newGoBackBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.closeProject();
    });
    
    goBackContainer.appendChild(newGoBackBtn);
    return goBackContainer;
  }
  
  limitSmallImages(container, maxCount) {
    const smallImages = container.querySelectorAll('.project-small-img');
    for (let i = smallImages.length - 1; i >= maxCount; i--) {
      smallImages[i].remove();
    }
  }
  
  updateSmallImages(container, images) {
    const smallImages = container.querySelectorAll('.project-small-img img');
    images.forEach((imgData, index) => {
      if (smallImages[index]) {
        smallImages[index].src = imgData.src;
        smallImages[index].alt = imgData.alt;
      }
    });
  }
  
  updateLargeImage(container, src, alt) {
    const largeImage = container.querySelector('img');
    if (largeImage) {
      largeImage.src = src;
      largeImage.alt = alt;
    }
  }
  
  updateMorePhotosText(element, text) {
    if (element) {
      const span = element.querySelector('span');
      if (span) {
        span.textContent = text;
      } else {
        element.innerHTML = `<span>${text}</span>`;
      }
    }
  }
  
  repositionButtons(wrapper, morePhotos, goBack, videoHeight, topOffset = 0) {
    if (!wrapper || !morePhotos || !goBack) return;
    
    // Перемещаем кнопки
    morePhotos.parentNode.removeChild(morePhotos);
    goBack.parentNode.removeChild(goBack);
    
    wrapper.appendChild(morePhotos);
    wrapper.appendChild(goBack);
    
    if (window.innerWidth > 767) {
      wrapper.style.position = 'relative';
      
      const photosTop = topOffset || videoHeight;
      morePhotos.style.cssText = `
        position: absolute;
        left: 0;
        top: ${photosTop}px;
        margin-top: ${topOffset ? '0' : '32px'};
        z-index: 2;
      `;
      
      goBack.style.cssText = `
        position: absolute;
        left: 247px;
        top: ${topOffset ? photosTop + 12 : videoHeight + 44}px;
        margin-top: 0;
        z-index: 2;
      `;
    }
  }
  
  updateProjectData(imageSrc, title) {
    const projectText = document.querySelector('.project-text-block p');
    
    // Специальный текст для проектов
    if (this.projectTexts[title]) {
      if (projectText) {
        projectText.innerHTML = this.projectTexts[title];
      }
      return;
    }
    
    // Обычный текст для других проектов
    if (projectText) {
      projectText.innerHTML = `
        <strong>${title}</strong> — some text about the project. some text about the project. 
        some text about the project. some text about the project. some text about the project. 
        some text about the project. some text about the project. some text about the project. 
        some text about the project. some text about the project. some text about the project. 
        some text about the project. some text about the project. some text about the project. 
        some text about the project. some text about the project. some text about the project. 
        some text about the project. some text about the project. some text about the project. 
        some text about the project. some text about the project. some text about the project. 
        some text about the project. some text about the project. some text about the project.
      `;
    }
    
    // Обновляем главное изображение для обычных проектов
    const skipImageUpdate = [
      'mindplug', 'song poster', 'vintage', 
      'music zine', 'terracotta', 'a calendar for korean laboring folks'
    ];
    
    if (!skipImageUpdate.includes(title)) {
      const mainImage = document.querySelector('.project-large-img img');
      if (mainImage) {
        mainImage.src = imageSrc;
      }
    }
  }
  
  // Методы адаптации для мобильных
  adaptCalendarForMobile(elements) {
    if (window.innerWidth <= 767) {
      if (elements.projectWrapper) elements.projectWrapper.style.position = 'static';
      if (elements.morePhotos) {
        elements.morePhotos.style.cssText = '';
        elements.morePhotos.style.marginTop = '20px';
        elements.morePhotos.style.order = '1';
        elements.morePhotos.style.alignSelf = 'flex-start';
      }
      if (elements.projectGoBack) {
        elements.projectGoBack.style.cssText = '';
        elements.projectGoBack.style.marginTop = '12px';
        elements.projectGoBack.style.order = '2';
        elements.projectGoBack.style.alignSelf = 'flex-start';
      }
    }
  }
  
  adaptMusicZineForMobile(elements) {
    if (window.innerWidth <= 767) {
      if (elements.projectWrapper) elements.projectWrapper.style.position = 'static';
      if (elements.morePhotos) {
        elements.morePhotos.style.cssText = '';
        elements.morePhotos.style.marginTop = '20px';
        elements.morePhotos.style.order = '1';
        elements.morePhotos.style.alignSelf = 'flex-start';
      }
      if (elements.projectGoBack) {
        elements.projectGoBack.style.cssText = '';
        elements.projectGoBack.style.marginTop = '12px';
        elements.projectGoBack.style.order = '2';
        elements.projectGoBack.style.alignSelf = 'flex-start';
      }
    }
  }
  
  adaptForMobile(element, type) {
    if (window.innerWidth <= 767 && element) {
      element.style.gridColumn = '1';
      element.style.width = '100%';
      element.style.height = 'auto';
      element.style.aspectRatio = '977 / 595';
    }
  }
  
  adaptSongPosterForMobile() {
    if (window.innerWidth <= 767) {
      const projectWrapper = this.projectContent.querySelector('.project-wrapper');
      const gifContainer = this.projectContent.querySelector('.song-poster-gif-container');
      const goBackContainer = this.projectContent.querySelector('.song-poster-go-back-container');
      
      if (projectWrapper) projectWrapper.style.alignItems = 'center';
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
  
  updateButtonPosition() {
    // Кнопка уже правильно позиционирована через CSS Grid
  }
  
  reinitializeGallery() {
    setTimeout(() => {
      if (window.gallery && typeof window.gallery.reinitGalleryTriggers === 'function') {
        window.gallery.reinitGalleryTriggers();
      }
    }, 150);
  }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => new ProjectView(), 1000);
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
    
    this.overlay.addEventListener('click', (e) => {
      if (!e.target.classList.contains('gallery-arrow')) {
        this.close();
      }
    });
    
    this.disableGalleryForSpecialProjects();
  }
  
  // Основные методы
  collectImages() {
    this.images = [];
    const projectContent = document.querySelector('.project-content');
    
    const projectType = this.getProjectType(projectContent);
    console.log('Collecting images for project type:', projectType);
    
    switch(projectType) {
      case 'calendar':
        this.collectCalendarImages();
        break;
      case 'music-zine':
        this.collectMusicZineImages();
        break;
      case 'regular':
        this.collectRegularImages();
        break;
      default:
        console.log('No gallery for this project type');
    }
  }
  
  getProjectType(projectContent) {
    if (!projectContent) return 'regular';
    
    if (projectContent.classList.contains('calendar-project')) return 'calendar';
    if (projectContent.classList.contains('music-zine-project')) return 'music-zine';
    
    const disabledProjects = [
      'mindplug-project', 'song-poster-project',
      'terracotta-project', 'vintage-project'
    ];
    
    for (const project of disabledProjects) {
      if (projectContent.classList.contains(project)) {
        return 'disabled';
      }
    }
    
    return 'regular';
  }
  
  collectCalendarImages() {
    // 2 видимых маленьких фото
    const smallImgs = document.querySelectorAll('.project-small-img img');
    smallImgs.forEach(img => {
      this.images.push(img.src);
    });
    
    // 5 дополнительных фото для календаря
    for (let i = 3; i <= 7; i++) {
      this.images.push(`assets/images/calendar_small_${i}.jpg`);
    }
    
    console.log('Total Calendar images:', this.images.length);
  }
  
  collectMusicZineImages() {
    // Большое изображение
    const mainImg = document.querySelector('.project-large-img img');
    if (mainImg) this.images.push(mainImg.src);
    
    // 2 видимых маленьких изображения
    document.querySelectorAll('.project-small-img img').forEach(img => {
      this.images.push(img.src);
    });
    
    // 6 дополнительных изображений
    for (let i = 4; i <= 9; i++) {
      this.images.push(`assets/images/zine_${i}.jpg`);
    }
    
    console.log('Total Music Zine images:', this.images.length);
  }
  
  collectRegularImages() {
    const mainImg = document.querySelector('.project-large-img img');
    if (mainImg) this.images.push(mainImg.src);
    
    document.querySelectorAll('.project-small-img img').forEach(img => {
      this.images.push(img.src);
    });
    
    // Дополнительные изображения (симуляция)
    for (let i = 3; i <= 12; i++) {
      const colors = [
        '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
        '#ffeaa7', '#fab1a0', '#a29bfe', '#fd79a8',
        '#55efc4', '#81ecec', '#74b9ff', '#dfe6e9'
      ];
      this.images.push(`https://via.placeholder.com/800x600/${colors[i-1].substring(1)}/ffffff?text=Project+${i}`);
    }
    
    console.log('Total regular project images:', this.images.length);
  }
  
  // Управление триггерами
  reinitGalleryTriggers() {
    console.log('Reinitializing gallery triggers...');
    this.resetGallery();
    this.removeAllEventListeners();
    this.setupOpenTriggers();
  }
  
  resetGallery() {
    this.images = [];
    this.currentIndex = 0;
  }
  
  removeAllEventListeners() {
    const elements = [
      { selector: '.project-large-img', property: 'largeImgContainer' },
      { selector: '.project-small-img', property: 'smallImgs', isMultiple: true },
      { selector: '.more-photos', property: 'moreBtn' }
    ];
    
    elements.forEach(({ selector, property, isMultiple }) => {
      const elements = isMultiple 
        ? document.querySelectorAll(selector)
        : [document.querySelector(selector)];
      
      elements.forEach(el => {
        if (el) {
          const newEl = el.cloneNode(true);
          el.parentNode.replaceChild(newEl, el);
        }
      });
    });
  }
  
  setupOpenTriggers() {
    this.setupLargeImageTrigger();
    this.setupSmallImagesTriggers();
    this.setupMorePhotosTrigger();
  }
  
  setupLargeImageTrigger() {
    const largeImgContainer = document.querySelector('.project-large-img');
    if (largeImgContainer) {
      largeImgContainer.style.cursor = 'pointer';
      largeImgContainer.addEventListener('click', () => this.open(0));
    }
  }
  
  setupSmallImagesTriggers() {
    document.querySelectorAll('.project-small-img').forEach((el, i) => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => this.open(i + 1));
    });
  }
  
  setupMorePhotosTrigger() {
    const moreBtn = document.querySelector('.more-photos');
    if (moreBtn) {
      moreBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.open(0);
      });
    }
  }
  
  // Управление галереей
  open(index = 0) {
    const projectContent = document.querySelector('.project-content');
    const projectType = this.getProjectType(projectContent);
    
    if (projectType === 'disabled') {
      console.log('Gallery disabled for this project type');
      return;
    }
    
    this.collectImages();
    
    if (this.images.length === 0) {
      console.error('No images found for gallery!');
      return;
    }
    
    this.currentIndex = Math.min(index, this.images.length - 1);
    this.updateImage();
    this.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    const cursor = document.querySelector('.custom-cursor');
    if (cursor) cursor.style.display = 'none';
  }
  
  close() {
    this.overlay.classList.remove('active');
    document.body.style.overflow = '';
    
    const cursor = document.querySelector('.custom-cursor');
    if (cursor) {
      cursor.style.display = 'block';
      setTimeout(() => {
        if (window.smoothCursorInstance) {
          cursor.style.transform = `translate(${window.smoothCursorInstance.pos.x}px, ${window.smoothCursorInstance.pos.y}px)`;
        }
      }, 50);
    }
  }
  
  updateImage() {
    this.content.innerHTML = '';
    
    if (this.currentIndex < 0 || this.currentIndex >= this.images.length) {
      console.error('Invalid image index:', this.currentIndex);
      return;
    }
    
    const img = document.createElement('img');
    img.src = this.images[this.currentIndex];
    img.alt = `Image ${this.currentIndex + 1}`;
    img.style.cssText = 'pointer-events: none; max-width: 100%; max-height: 100%; object-fit: contain;';
    
    img.onerror = () => {
      console.error('Failed to load image:', img.src);
      img.src = 'https://via.placeholder.com/800x600/cccccc/999999?text=Image+not+found';
    };
    
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
  
  // Вспомогательные методы
  setupControls() {
    const prevBtn = document.querySelector('.gallery-arrow.prev');
    const nextBtn = document.querySelector('.gallery-arrow.next');
    
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.prev();
    });
    
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.next();
    });
    
    document.addEventListener('keydown', (e) => {
      if (!this.overlay.classList.contains('active')) return;
      
      switch(e.key) {
        case 'Escape':
          this.close();
          break;
        case 'ArrowLeft':
          this.prev();
          break;
        case 'ArrowRight':
          this.next();
          break;
      }
    });
  }
  
  disableGalleryForSpecialProjects() {
    const checkForSpecialProjects = () => {
      const projectContent = document.querySelector('.project-content');
      const disabledProjects = [
        'mindplug-project', 'song-poster-project',
        'terracotta-project', 'vintage-project'
      ];
      
      const isDisabled = disabledProjects.some(project => 
        projectContent && projectContent.classList.contains(project)
      );
      
      if (isDisabled) {
        this.disableTriggers();
      }
    };
    
    setInterval(checkForSpecialProjects, 500);
  }
  
  disableTriggers() {
    const elements = [
      { selector: '.project-large-img', cursor: 'default' },
      { selector: '.project-small-img', cursor: 'default', isMultiple: true },
      { selector: '.more-photos', cursor: 'default' }
    ];
    
    elements.forEach(({ selector, cursor, isMultiple }) => {
      const els = isMultiple 
        ? document.querySelectorAll(selector)
        : [document.querySelector(selector)];
      
      els.forEach(el => {
        if (el) {
          el.style.cursor = cursor;
          const newEl = el.cloneNode(true);
          el.parentNode.replaceChild(newEl, el);
        }
      });
    });
  }
}

// Запуск галереи
document.addEventListener('DOMContentLoaded', () => {
  window.gallery = new SimpleGallery();
  console.log('Gallery initialized');
});