/**
 * Интеркомы заданы статически через ENV — для MVP одна панель.
 * Дополнительные панели добавляются как INTERCOM_2_*, INTERCOM_3_* и т.д.
 */
export interface IntercomConfig {
  id: string;
  name: string;
  /** SIP-extension, который Asterisk использует при поступлении звонка с панели. */
  sipExtension: string;
  /** Кого набирать при входящем (Dial PJSIP/<dialUri>). Группа мобильных endpoint'ов. */
  dialUri: string;
  /** RTSP-URL прямого видео с панели (LAN). */
  rtspUrl?: string;
  /** HTTP-API панели для открытия двери вне звонка. */
  openUrl?: string;
  /** Метод HTTP (по умолчанию POST). */
  openMethod?: 'GET' | 'POST';
  /** Basic auth для openUrl (формат user:pass). */
  openAuth?: string;
  /** DTMF-последовательность для открытия в активном звонке. */
  openDtmf: string;
}

function loadIntercom(prefix: string): IntercomConfig | null {
  const id = process.env[`${prefix}_ID`];
  if (!id) return null;
  return {
    id,
    name: process.env[`${prefix}_NAME`] ?? id,
    sipExtension: process.env[`${prefix}_SIP_EXT`] ?? id,
    dialUri: process.env[`${prefix}_DIAL_URI`] ?? 'mobiles',
    rtspUrl: process.env[`${prefix}_RTSP_URL`],
    openUrl: process.env[`${prefix}_OPEN_URL`],
    openMethod: (process.env[`${prefix}_OPEN_METHOD`] as 'GET' | 'POST') ?? 'POST',
    openAuth: process.env[`${prefix}_OPEN_AUTH`],
    openDtmf: process.env[`${prefix}_OPEN_DTMF`] ?? '#',
  };
}

export function loadIntercoms(): IntercomConfig[] {
  const list: IntercomConfig[] = [];
  for (const prefix of ['INTERCOM', 'INTERCOM_2', 'INTERCOM_3']) {
    const ic = loadIntercom(prefix);
    if (ic) list.push(ic);
  }
  if (list.length === 0) {
    // Дефолт, чтобы dev-сервер стартовал без env.
    list.push({
      id: 'panel1',
      name: 'Подъезд 1',
      sipExtension: '101',
      dialUri: 'mobiles',
      openDtmf: '#',
    });
  }
  return list;
}
