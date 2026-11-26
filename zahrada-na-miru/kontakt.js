const photos = document.querySelectorAll("[data-portfolio-photo]");
if (photos.length && "IntersectionObserver" in window &&
    window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;

      entry.target.classList.add("portfolio-photo-visible");
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.12 });

  photos.forEach((photo) => observer.observe(photo));
}

const form = document.querySelector("#formular");
const preview = document.querySelector("#navrh-poptavky");
const message = document.querySelector("#text-poptavky");
const feedback = document.querySelector("#zprava");
const mailButton = document.querySelector("#odeslat");
const emailHref = document.querySelector("#kontakt-email").getAttribute("href");
const fields = [
  { control: form.elements.sluzba, prompt: "Vyberte službu." },
  { control: form.elements.obec, prompt: "Zadejte obec, kde se má práce provést." },
  { control: form.elements.popis, prompt: "Stručně popište, jakou práci potřebujete." },
];

function showFieldError(control, error) {
  document.getElementById(control.getAttribute("aria-describedby")).textContent = error;
  if (error) {
    control.setAttribute("aria-invalid", "true");
  } else {
    control.removeAttribute("aria-invalid");
  }
}

function warnAboutDraft(event) {
  event.preventDefault();
  event.returnValue = true;
}

form.noValidate = true;
form.hidden = false;

form.addEventListener("input", (event) => {
  showFieldError(event.target, "");
  preview.hidden = true;
  if (fields.some(({ control }) => control.value.trim())) {
    window.addEventListener("beforeunload", warnAboutDraft);
  } else {
    window.removeEventListener("beforeunload", warnAboutDraft);
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  let firstInvalid;
  for (const { control, prompt } of fields) {
    const error = control.value.trim() ? "" : prompt;
    showFieldError(control, error);
    if (error) firstInvalid ||= control;
  }
  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  const [service, place, details] = fields.map(({ control }) => control.value.trim());
  const subject = `Poptávka zahradnických prací – ${service}`;

  message.value = [
    "Dobrý den,",
    "",
    "mám zájem o zahradnické práce.",
    "",
    `Služba: ${service}`,
    `Obec: ${place}`,
    "",
    details,
    "",
    "Děkuji a přeji hezký den.",
  ].join("\n");

  mailButton.href = `${emailHref}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message.value)}`;
  preview.hidden = false;
  feedback.textContent = "Text poptávky je připravený.";
  mailButton.focus();
  window.removeEventListener("beforeunload", warnAboutDraft);
  window.location.href = mailButton.href;
});

document.querySelector("#kopirovat").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(message.value);
    feedback.textContent = "Text poptávky je zkopírovaný.";
  } catch {
    message.focus();
    message.select();
    feedback.textContent = "Text je označený. Zkopírujte ho pomocí nabídky nebo klávesové zkratky.";
  }
});
