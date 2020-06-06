export default function formatWhatsapp(value: any) {
  if (value) {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  return;
}
