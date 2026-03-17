export const normalizePhone = (phone) => {
  const digits = (phone || '').replace(/\D/g, '');
  // Remove DDI 55 se presente para ter somente o número local (DDD + número)
  return digits.startsWith('55') ? digits.substring(2) : digits;
};

export const toEvolutionNumber = (phone) => {
  const local = normalizePhone(phone);
  if (!local) return null;
  // Formato esperado pela Evolution API: 55 + DDD + número (sem @s.whatsapp.net)
  return `55${local}`;
};

export const resolveTemplate = (tpl, contact) => {
  let result = tpl;
  const data = {
    '{name}': contact.name || '',
    '{primeiro_nome}': (contact.name || '').split(' ')[0],
    '{phone}': contact.phone || '',
    '{category}': contact.category || '',
    '{city}': contact.city || '',
    '{email}': contact.email || '',
    '{rating}': contact.rating || '',
  };

  Object.entries(data).forEach(([key, val]) => {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(escapedKey, 'g'), val);
  });
  return result;
};

export const extractImages = (html) => {
  const images = [];
  const regex = /<img[^>]+src="([^">]+)"/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    images.push(match[1]);
  }
  return images;
};

export const htmlToWhatsapp = (html) => {
  if (!html) return '';

  let text = html;

  // negrito
  text = text.replace(/<(b|strong)>([\s\S]*?)<\/(b|strong)>/gi, '*$2*');
  // itálico
  text = text.replace(/<(i|em)>([\s\S]*?)<\/(i|em)>/gi, '_$2_');
  // rasurado
  text = text.replace(/<(s|del)>([\s\S]*?)<\/(s|del)>/gi, '~$2~');
  
  // links
  text = text.replace(/<a[^>]+href="([^">]+)"[^>]*>([\s\S]*?)<\/a>/gi, (match, url, label) => {
    const cleanLabel = label.replace(/<[^>]+>/g, '').trim();
    const cleanUrl = url.replace(/^(mailto|https?|tel):/i, '').replace(/^\/\//, '').replace(/\/$/, '').trim();
    const cleanLabelCompare = cleanLabel.replace(/^(mailto|https?|tel):/i, '').replace(/^\/\//, '').replace(/\/$/, '').trim();
    
    if (cleanUrl === cleanLabelCompare || !cleanLabel) {
      return url.startsWith('mailto:') ? cleanLabel : url;
    }
    return `${cleanLabel} (${url})`;
  });

  // listas
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '* $1\n');
  text = text.replace(/<\/?(ul|ol)[^>]*>/gi, '\n');
  // parágrafos e quebras
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/(p|div)>/gi, '\n');

  // remover demais tags e limpar
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const htmlToText = (html) =>
  html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();
