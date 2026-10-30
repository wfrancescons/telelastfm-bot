export default function limitText(text: string, limit: number = 30): string {
  const trimmed = (text || "").trim();
  if (trimmed.length > limit) {
    return trimmed.substring(0, limit - 2) + "...";
  }
  return trimmed;
}

