// E-mail doplňte po potvrzení od provozovatele.
const kontakt = { email: "", telefon: "+420 732 612 365" };

const form = document.querySelector("#formular");
const preview = document.querySelector("#navrh-poptavky");
const message = document.querySelector("#text-poptavky");
const feedback = document.querySelector("#zprava");
const mailButton = document.querySelector("#odeslat");
const contactList = document.querySelector("#kontakt");

contactList.replaceChildren();

for (const [value, href] of [
  [kontakt.telefon, `tel:${kontakt.telefon.replace(/\s/g, "")}`],
  [kontakt.email, `mailto:${kontakt.email}`],
]) {
  if (!value) continue;
  const item = document.createElement("li");
  const link = document.createElement("a");
  link.textContent = value;
  link.href = href;
  item.append(link);
  contactList.append(item);
}
contactList.hidden = !contactList.children.length;
document.querySelector("#ukazka").hidden = Boolean(kontakt.email);

form.hidden = false;

for (const name of ["obec", "popis"]) {
  const field = form.elements.namedItem(name);
  field.addEventListener("input", () => {
    field.setCustomValidity(field.value && !field.value.trim() ? "Vyplňte prosím toto pole." : "");
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const fields = new FormData(form);
  const service = fields.get("sluzba");
  const place = fields.get("obec").trim();
  const details = fields.get("popis").trim();
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

  if (kontakt.email) {
    mailButton.href = `mailto:${kontakt.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message.value)}`;
    mailButton.hidden = false;
  }

  feedback.textContent = "";
  preview.hidden = false;
  message.focus();
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
