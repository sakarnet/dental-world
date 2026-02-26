(function () {
  // ===== Scroll lock =====
  let lockCount = 0;
  let prevOverflow = "";
  let prevPaddingRight = "";

  function lockScroll() {
    if (lockCount === 0) {
      prevOverflow = document.body.style.overflow;
      prevPaddingRight = document.body.style.paddingRight;

      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollBarWidth > 0) document.body.style.paddingRight = scrollBarWidth + "px";
    }
    lockCount++;
  }

  function unlockScroll() {
    if (lockCount === 0) return;
    lockCount--;
    if (lockCount === 0) {
      document.body.style.overflow = prevOverflow || "";
      document.body.style.paddingRight = prevPaddingRight || "";
    }
  }

  // ===== MODAL =====
  const modal = document.getElementById("appointment-modal");
  const openers = document.querySelectorAll('[data-modal-open="appointment"]');

  const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

  let lastFocused = null;

  function modalIsOpen() {
    return modal && modal.classList.contains("is-open");
  }

  function openModal() {
    if (!modal || modalIsOpen()) return;

    lastFocused = document.activeElement;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    lockScroll();

    const dialog = modal.querySelector(".modal__dialog");
    if (dialog && !dialog.hasAttribute("tabindex")) dialog.setAttribute("tabindex", "-1");

    const focusables = Array.from(modal.querySelectorAll(FOCUSABLE));
    const first = focusables[0] || dialog;
    if (first && typeof first.focus === "function") first.focus();
  }

  function closeModal() {
    if (!modal || !modalIsOpen()) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    unlockScroll();

    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  if (modal) {
    const overlay = modal.querySelector(".modal__overlay");
    const closers = modal.querySelectorAll("[data-modal-close]");
    const form = document.getElementById("appointment-form");

    openers.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        openModal();
      });
    });

    closers.forEach((btn) => btn.addEventListener("click", closeModal));
    if (overlay) overlay.addEventListener("click", closeModal);

    document.addEventListener("keydown", (e) => {
      if (!modalIsOpen()) return;

      if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
        return;
      }

      if (e.key !== "Tab") return;

      const focusables = Array.from(modal.querySelectorAll(FOCUSABLE)).filter((el) => {
        if (el.hasAttribute("disabled")) return false;
        if (el.getAttribute("aria-hidden") === "true") return false;
        return el.offsetParent !== null;
      });

      if (!focusables.length) {
        e.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    // ===== маски для полей =====
    const nameInput = form?.querySelector('input[name="name"]');
    const phoneInput = form?.querySelector('input[name="phone"]');

    // имя
    if (nameInput) {
      nameInput.addEventListener("input", function () {
        this.value = this.value.replace(/[^а-яА-ЯёЁ\s\-]/g, "");
      });
    }

    if (phoneInput) {
      phoneInput.addEventListener("input", function () {
        const input = this;
        const oldValue = input.value;
        const cursorPos = input.selectionStart;

        let digits = oldValue.replace(/\D/g, "");
        if (digits.length === 0) {
          input.value = "+7 ";
          input.setSelectionRange(3, 3);
          return;
        }

        if (digits[0] !== "7") {
          digits = "7" + digits.slice(0, 10);
        } else {
          digits = digits.slice(0, 11);
        }

        let formatted = "+7";
        if (digits.length > 1) {
          formatted += " (" + digits.slice(1, 4);
        }
        if (digits.length >= 4) {
          formatted += ") " + digits.slice(4, 7);
        }
        if (digits.length >= 7) {
          formatted += "-" + digits.slice(7, 9);
        }
        if (digits.length >= 9) {
          formatted += "-" + digits.slice(9, 11);
        }

        const oldDigitsBeforeCursor = (oldValue.slice(0, cursorPos).match(/\d/g) || []).length;
        input.value = formatted;

        let newCursorPos = 0;
        let digitsCount = 0;
        for (let i = 0; i < formatted.length; i++) {
          if (/\d/.test(formatted[i])) {
            digitsCount++;
            if (digitsCount === oldDigitsBeforeCursor + 1) {
              newCursorPos = i + 1;
              break;
            }
          }
        }
        if (newCursorPos === 0) {
          newCursorPos = formatted.length;
        }

        input.setSelectionRange(newCursorPos, newCursorPos);
      });

      phoneInput.addEventListener("focus", function () {
        if (this.value === "+7 " || this.value === "+7") {
          this.value = "+7 ";
          this.setSelectionRange(3, 3);
        }
      });
    }

    // ===== Валидация формы =====
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        let isValid = true;

        if (!nameInput || nameInput.value.trim() === "") {
          alert("Пожалуйста, введите имя.");
          isValid = false;
        }

        if (isValid && phoneInput) {
          const digits = phoneInput.value.replace(/\D/g, "");
          if (digits.length !== 11) {
            alert("Телефон должен содержать 11 цифр (например, +7 999 123-45-67).");
            isValid = false;
          } else if (digits[0] !== "7") {
            alert("Номер телефона должен начинаться с +7.");
            isValid = false;
          }
        }

        if (!isValid) return;

        const formData = new FormData(form);

        // функция отправки с повторными попытками
        const submitWithRetry = async (retries = 3) => {
          for (let attempt = 1; attempt <= retries; attempt++) {
            try {
              const response = await fetch('save-appointment.php', {
                method: 'POST',
                body: formData
              });

              const result = await response.text();

              if (result === "success") {
                alert("Заявка успешно отправлена! Мы скоро свяжемся.");
                closeModal();
                form.reset();
                if (phoneInput) phoneInput.value = "+7 ";
                return; // успех
              } else {
               
                alert("Произошла ошибка при отправке. Попробуйте позже.");
                return;
              }
            } catch (error) {
              console.error(`Попытка ${attempt} не удалась:`, error);
              if (attempt === retries) {
                alert("Ошибка соединения с сервером. Пожалуйста, попробуйте ещё раз.");
              } else {
                
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          }
        };

        await submitWithRetry(3);
      });
    }
  }

  // ===== MOBILE MENU =====
  const burger = document.querySelector("[data-burger]");
  const menu = document.getElementById("mobileMenu");

  function menuIsOpen() {
    return menu && menu.classList.contains("is-open");
  }

  function openMenu() {
    if (!menu || menuIsOpen()) return;

    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");

    if (burger) {
      burger.classList.add("is-open");
      burger.setAttribute("aria-expanded", "true");
    }

    lockScroll();
  }

  function closeMenu() {
    if (!menu || !menuIsOpen()) return;

    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");

    if (burger) {
      burger.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
    }

    unlockScroll();
  }

  if (burger && menu) {
    const closeBtn = menu.querySelector("[data-mobile-close]");
    const links = menu.querySelectorAll("[data-mobile-link]");

    burger.addEventListener("click", () => {
      if (menuIsOpen()) closeMenu();
      else openMenu();
    });

    if (closeBtn) closeBtn.addEventListener("click", closeMenu);

    links.forEach((a) => a.addEventListener("click", () => closeMenu()));

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (modalIsOpen()) return;
      if (menuIsOpen()) closeMenu();
    });

    const mq = window.matchMedia("(min-width: 861px)");
    mq.addEventListener?.("change", (e) => {
      if (e.matches && menuIsOpen()) closeMenu();
    });
  }
})();