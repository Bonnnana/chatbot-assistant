export interface FinkiWorkflow {
  id: string;
  name: string;
  patterns: string[];
  actions: Array<{
    type: string;
    parameters: Record<string, any>;
    description: string;
  }>;
  extractParams?: (userInput: string) => Record<string, string>;
}

// Map common Macedonian/English keywords to the EXACT iKnow dropdown option text
// Use exact spacing and parentheses so selection works reliably
const IKNOW_DOCUMENT_KEYWORD_MAP: Array<{ keywords: string[]; option: string }> = [
  {
    keywords: [
      'certificate of enrollment',
      'enrollment certificate',
      'student certificate',
      'потврда за редовен студент',
      'уверение за редовен студент',
      'uverenie za redoven',
      'potvrda za redoven',
    ],
    option: 'Уверение за редовен студент - ФИНКИ ( 0)',
  },
  {
    keywords: ['paper certificate', 'хартиена потврда', 'потврда хартија'],
    option: 'Барање за потврда за редовен студент (хартиена) ( 100)',
  },
  {
    keywords: ['diploma supplement', 'додаток на диплома'],
    option: 'Додаток на диплома ( 0)',
  },
  {
    keywords: ['transcript', 'transcript of records', 'grades certificate', 'оценки', 'извод на положени испити'],
    option: 'Уверение за положени испити ФИНКИ ( 100)',
  },
  {
    keywords: ['english transcript', 'transcript in english', 'англиски уверение оценки'],
    option: 'Уверение за положени испити(АНГ.) (Старо) ( 1000)',
  },
  {
    keywords: ['recognition of passed exams', 'recognition', 'признавање на положени испити'],
    option: 'Признавање на положени испити ( 0)',
  },
  {
    keywords: ['late exam registration', 'закаснето пријавување', 'задоцнето пријавување'],
    option: 'Барање за задоцнето пријавувањe на испит (од 2024г) ( 1000)',
  },
  {
    keywords: ['retroactive semester', 'ретроактивен семестар'],
    option: 'Барање за административно регулирање на ретроактивен семестар (од 2024г) ( 1000)',
  },
  {
    keywords: ['enroll semester after deadline', 'запишување семестар по истек на рок'],
    option: 'Барање за запишување на семестар по истек на рок (од 2024г) ( 1500)',
  },
  {
    keywords: ['pause studies', 'мирување на студии'],
    option: 'Барање за мирување на студиите (од 2024г) ( 2000)',
  },
  {
    keywords: ['cancel exam', 'поништување на испит'],
    option: 'Барање за поништување на испит (од 2024г) ( 2000)',
  },
  {
    keywords: ['change elective', 'промена на изборен предмет'],
    option: 'Барање за промена на изборен предмет (од 2024г) ( 1500)',
  },
  {
    keywords: ['change passed subject', 'промена на положен предмет'],
    option: 'Барање за промена на положен предмет (од 2024г) ( 0)',
  },
  {
    keywords: ['change study program same accreditation', 'истa акредитација студиска програма'],
    option: 'Барање за промена на студиска програма од иста акредитација (од 2024г) ( 2000)',
  },
  {
    keywords: ['change study program newer accreditation', 'понова акредитација студиска програма'],
    option: 'Барање за промена на студиска програма од понова акредитација (од 2024г) ( 3000)',
  },
  {
    keywords: ['graduation package', 'пакет за дипломирање'],
    option: 'Барање за пакет за дипломирање (од 2024г) ( 6200)',
  },
  {
    keywords: ['cancel diploma topic', 'откажување тема дипломска'],
    option: 'Барање за откажување на пријавена тема за дипломска работа (од 2024г) ( 1000)',
  },
  {
    keywords: ['student record card', 'student card', 'студентски картон'],
    option: 'Студентски картон (Старо) ( 0)',
  },
  {
    keywords: ['uppi form', 'uppi', 'УППИ', 'uppi scholarship', 'uppi стипендија'],
    option: 'УППИ образец ( 0)',
  },
  {
    keywords: ['uppi scholarship', 'УППИ стипендија'],
    option: 'УППИ образец - стипендија ( 0)',
  },
  {
    keywords: ['iksa', 'икса'],
    option: 'ИКСА ( 750)',
  },
  {
    keywords: ['graduated certificate', 'уверение дипломиран', 'diplomiran certificate'],
    option: 'Уверение дипломиран - ФИНКИ ( 3000)',
  },
  {
    keywords: ['graduated certificate english', 'англиски дипломиран'],
    option: 'Уверение Дипломиран (АНГ) - ФИНКИ ( 3000)',
  },
];

function mapUserInputToIknowDocumentOption(userInput: string): string {
  const lower = userInput.toLowerCase();
  for (const entry of IKNOW_DOCUMENT_KEYWORD_MAP) {
    for (const kw of entry.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        return entry.option;
      }
    }
  }
  // default to student certificate of enrollment
  return 'Уверение за редовен студент - ФИНКИ ( 0)';
}

export const FINKI_WORKFLOWS: FinkiWorkflow[] = [
  {
    id: 'consultation-booking',
    name: 'Consultation Booking',
    patterns: [
      'consultation',
      'konsultacii',
      'консултации',
      'schedule consultation',
      'book consultation',
      'закажи консултација',
      'prof',
      'professor',
    ],
    extractParams: (userInput: string) => {
      const professorMatch = userInput.match(/(?:with|за)\s+([A-Za-zА-Яа-я\s]+)/i);
      return {
        professor_name: professorMatch ? professorMatch[1].trim() : 'Velinov',
      };
    },
    actions: [
      {
        type: 'go_to_url',
        parameters: { url: 'https://consultations.finki.ukim.mk/' },
        description: 'Navigate to consultation system',
      },
      {
        type: 'wait',
        parameters: { seconds: 2 },
        description: 'Wait for page to load',
      },
      {
        type: 'click_element',
        parameters: {
          index: 0, // Will be updated by navigator to find login button
          intent: 'Click login button',
        },
        description: 'Click login button',
      },
      {
        type: 'wait',
        parameters: { seconds: 2 },
        description: 'Wait for login page',
      },
      {
        type: 'input_text',
        parameters: {
          index: 0, // Will be updated by navigator to find search field
          text: 'Trajanov',
          intent: 'Search for professor Trajanov',
        },
        description: 'Search for professor Trajanov',
      },
      {
        type: 'wait',
        parameters: { seconds: 1 },
        description: 'Wait for search results',
      },
      {
        type: 'click_element',
        parameters: {
          index: 0, // Will be updated by navigator to find professor result
          intent: 'Click on professor result',
        },
        description: 'Click on professor result',
      },
      {
        type: 'wait',
        parameters: { seconds: 2 },
        description: 'Wait for professor page',
      },
      {
        type: 'click_element',
        parameters: {
          index: 0, // Will be updated by navigator to find consultation link
          intent: 'Click consultations link',
        },
        description: 'Click consultations link',
      },
      {
        type: 'wait',
        parameters: { seconds: 2 },
        description: 'Wait for consultation slots',
      },
      {
        type: 'click_element',
        parameters: {
          index: 0, // Will be updated by navigator to find booking button
          intent: 'Book consultation',
        },
        description: 'Book consultation',
      },
    ],
  },
  {
    id: 'uverenie-request',
    name: 'Uverenie (Certificate) Request',
    patterns: [
      'uverenie',
      'уверение',
      'baranje',
      'барање',
      'baranje za uverenie',
      'барање за уверение',
      'certificate request',
      'request certificate',
      'поднеси барање',
      'submit request',
    ],
    extractParams: (userInput: string) => {
      const lower = userInput.toLowerCase();
      // document type
      const isUverenie = /(uverenie|уверение)/i.test(userInput);
      const isPotvrda = /(potvrda|потврда)/i.test(userInput);
      const document_type = isPotvrda ? 'Потврда' : isUverenie ? 'Уверение' : 'Уверение';

      // language
      let language = 'Македонски';
      if (/(english|англиски|en)\b/i.test(userInput)) language = 'English';
      if (/(македонски|mk)\b/i.test(userInput)) language = 'Македонски';

      // purpose (after 'for' or 'за')
      let purpose = '';
      const purposeMatch = lower.match(/(?:for|за)\s+([^,.!?\n]+)/i);
      if (purposeMatch) {
        purpose = purposeMatch[1].trim();
      }

      return { document_type, language, purpose };
    },
    actions: [
      {
        type: 'go_to_url',
        parameters: { url: 'https://www.iknow.ukim.mk/', intent: 'Open iKnow portal' },
        description: 'Navigate to iKnow system',
      },
      {
        type: 'wait',
        parameters: { seconds: 2, intent: 'Wait for iKnow to load' },
        description: 'Wait for page to load',
      },
      {
        type: 'click_element',
        parameters: {
          index: 0,
          intent: 'Click the login/sign in button on iKnow',
        },
        description: 'Open login form',
      },
      {
        type: 'wait',
        parameters: { seconds: 2, intent: 'Wait for login/navigation to complete' },
        description: 'Wait for redirect',
      },
      {
        type: 'click_element',
        parameters: {
          index: 0,
          intent: 'Open student services or requests section',
        },
        description: 'Open student services/requests',
      },
      {
        type: 'wait',
        parameters: { seconds: 1, intent: 'Wait for services to render' },
        description: 'Wait for services page',
      },
      {
        type: 'click_element',
        parameters: {
          index: 0,
          intent: 'Create new request (Ново барање)',
        },
        description: 'Create new request',
      },
      {
        type: 'wait',
        parameters: { seconds: 1, intent: 'Wait for request form to open' },
        description: 'Wait for request form',
      },
      {
        type: 'get_dropdown_options',
        parameters: {
          index: 0,
          intent: 'Get options for document type dropdown',
        },
        description: 'List document types',
      },
      {
        type: 'select_dropdown_option',
        parameters: {
          index: 0,
          text: '{document_type}',
          intent: 'Choose document type {document_type}',
        },
        description: 'Choose document type',
      },
      {
        type: 'select_dropdown_option',
        parameters: {
          index: 0,
          text: '{language}',
          intent: 'Select language {language}',
        },
        description: 'Select language',
      },
      {
        type: 'input_text',
        parameters: {
          index: 0,
          text: '{purpose}',
          intent: 'Fill purpose of request with: {purpose}',
        },
        description: 'Fill purpose of request',
      },
      {
        type: 'click_element',
        parameters: {
          index: 0,
          intent: 'Submit the request (Поднеси барање)',
        },
        description: 'Submit the request',
      },
      {
        type: 'done',
        parameters: {
          text: 'Submitted {document_type} request in {language}.',
          success: true,
        },
        description: 'Finish after submission',
      },
    ],
  },
  {
    id: 'document-request',
    name: 'Document Request',
    patterns: [
      'document',
      'документ',
      'certificate',
      'потврда',
      'iknow',
      'икноу',
      'request document',
      'закажи документ',
      'baranje za dokument',
      'барање за документ',
      // student certificate
      'certificate of enrollment',
      'enrollment certificate',
      'student certificate',
      'потврда за редовен',
      'уверение за редовен',
      'uverenie',
      // diploma supplement
      'diploma supplement',
      'додаток на диплома',
      // transcript
      'transcript',
      'grades certificate',
      'уверение за положени испити',
      // recognition
      'recognition',
      'признавање на положени испити',
      // admin requests
      'retroactive semester',
      'ретроактивен семестар',
      'late exam registration',
      'задоцнето пријавување',
      'enroll semester after deadline',
      'запишување семестар по истек',
      'pause studies',
      'мирување на студии',
      'cancel exam',
      'поништување на испит',
      'change elective',
      'промена на изборен предмет',
      'change passed subject',
      'промена на положен предмет',
      'change study program',
      'промена на студиска програма',
      'graduation package',
      'пакет за дипломирање',
      'cancel diploma topic',
      'откажување тема дипломска',
      // other
      'student record card',
      'студентски картон',
      'uppi',
      'УППИ',
      'iksa',
      'икса',
    ],
    extractParams: (userInput: string) => {
      const document_type = mapUserInputToIknowDocumentOption(userInput);
      return { document_type };
    },
    actions: [
      {
        type: 'go_to_url',
        parameters: { url: 'https://www.iknow.ukim.mk/' },
        description: 'Navigate to iKnow system',
      },
      {
        type: 'wait',
        parameters: { seconds: 2 },
        description: 'Wait for page to load',
      },
      {
        type: 'click_element',
        parameters: {
          index: 0,
          intent: 'Open student services/requests to request a document',
        },
        description: 'Open services/requests',
      },
      {
        type: 'wait',
        parameters: { seconds: 1 },
        description: 'Wait for services page',
      },
      {
        type: 'click_element',
        parameters: {
          index: 0,
          intent: 'Create new request for {document_type}',
        },
        description: 'Create new request',
      },
    ],
  },
  {
    id: 'document-download',
    name: 'Download/Take Document',
    patterns: [
      'download document',
      'преземи документ',
      'земи документ',
      'подигни документ',
      'take document',
      'download certificate',
      'преземи уверение',
      'преземи потврда',
    ],
    extractParams: (userInput: string) => {
      const isUverenie = /(uverenie|уверение)/i.test(userInput);
      const isPotvrda = /(potvrda|потврда|certificate)/i.test(userInput);
      const document_type = isUverenie ? 'Уверение' : isPotvrda ? 'Потврда' : 'Document';
      return { document_type };
    },
    actions: [
      {
        type: 'go_to_url',
        parameters: { url: 'https://www.iknow.ukim.mk/', intent: 'Open iKnow portal' },
        description: 'Navigate to iKnow system',
      },
      {
        type: 'wait',
        parameters: { seconds: 2, intent: 'Wait for portal to load' },
        description: 'Wait for page to load',
      },
      {
        type: 'click_element',
        parameters: {
          index: 0,
          intent: 'Open my requests or documents page',
        },
        description: 'Open documents/requests list',
      },
      {
        type: 'wait',
        parameters: { seconds: 1, intent: 'Wait for list to load' },
        description: 'Wait for list',
      },
      {
        type: 'click_element',
        parameters: {
          index: 0,
          intent: 'Download {document_type} (Преземи)',
        },
        description: 'Click download for the requested document',
      },
      {
        type: 'done',
        parameters: {
          text: 'Attempted to download {document_type}. If a new tab opened, the file should be downloading.',
          success: true,
        },
        description: 'Finish after initiating download',
      },
    ],
  },
  {
    id: 'course-content',
    name: 'Course Content Access',
    patterns: [
      'course',
      'курс',
      // assignments/homework
      'assignment',
      'assignments',
      'задавање',
      'домашна',
      'домашни',
      'homework',
      'tasks',
      'задачи',
      // surveys (mk/en + common latin typo)
      'survey',
      'surveys',
      'анкета',
      'анкети',
      'anketi',
      'анкeти',
      // announcements/news
      'announcement',
      'announcements',
      'најава',
      'најави',
      'известување',
      'известувања',
      'соопштение',
      'соопштенија',
      // materials
      'materials',
      'материјали',
      // time phrases to trigger calendar flow
      'this month',
      'next month',
      'овај месец',
      'овој месец',
      'следниот месец',
      'следен месец',
      'идниот месец',
      // months (mk/en)
      'january',
      'february',
      'march',
      'april',
      'may',
      'june',
      'july',
      'august',
      'september',
      'october',
      'november',
      'december',
      'јануари',
      'февруари',
      'март',
      'април',
      'мај',
      'јуни',
      'јули',
      'август',
      'септември',
      'октомври',
      'ноември',
      'декември',
    ],
    extractParams: (userInput: string) => {
      const courseMatch = userInput.match(/(?:course|курс|subject|предмет)\s+([A-Za-zА-Яа-я\s]+)/i);
      const contentMatch = userInput.match(
        /(assignments?|задавање|homework|домашн[аи]|tasks?|задачи|surveys?|анкета|анкети|anketi|announcement|announcements|најава|најави|известување|известувања|соопштение|соопштенија|materials|материјали)/i,
      );
      let content_type = 'assignments';
      if (contentMatch) {
        const val = contentMatch[1].toLowerCase();
        if (/(survey|surveys|анкета|анкети|anketi)/.test(val)) content_type = 'surveys';
        else if (/(announcement|announcements|најава|најави|известување|известувања|соопштение|соопштенија)/.test(val))
          content_type = 'announcements';
        else if (/(materials|материјали)/.test(val)) content_type = 'materials';
        else content_type = 'assignments';
      }
      return {
        course_name: courseMatch ? courseMatch[1].trim() : 'Programming',
        content_type,
      };
    },
    actions: [
      {
        type: 'go_to_url',
        parameters: { url: 'https://courses.finki.ukim.mk/' },
        description: 'Navigate to courses system',
      },
      {
        type: 'wait',
        parameters: { seconds: 2 },
        description: 'Wait for page to load',
      },
    ],
  },
];

export function findFinkiWorkflow(userInput: string): FinkiWorkflow | null {
  const lowerInput = userInput.toLowerCase();

  for (const workflow of FINKI_WORKFLOWS) {
    for (const pattern of workflow.patterns) {
      if (lowerInput.includes(pattern.toLowerCase())) {
        return workflow;
      }
    }
  }

  return null;
}

export function executeFinkiWorkflow(workflow: FinkiWorkflow, userInput: string, actionRegistry: any): any[] {
  const params = workflow.extractParams ? workflow.extractParams(userInput) : {};

  return workflow.actions.map(action => {
    const actionName = action.type;
    const actionParams = { ...action.parameters };

    // Replace placeholders with actual values
    Object.keys(params).forEach(key => {
      const placeholder = `{${key}}`;
      Object.keys(actionParams).forEach(paramKey => {
        if (typeof actionParams[paramKey] === 'string') {
          actionParams[paramKey] = actionParams[paramKey].replace(placeholder, params[key]);
        }
      });
    });

    return { [actionName]: actionParams };
  });
}
