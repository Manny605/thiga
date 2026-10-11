/**
 * Textes des pages légales, en français et en arabe.
 *
 * Ils décrivent le fonctionnement réel de la plateforme (qui voit quoi, où
 * sont hébergées les données) mais ne remplacent pas une relecture juridique.
 * Les passages entre [[doubles crochets]] sont à compléter par l'éditeur :
 * la page les surligne pour qu'aucun ne parte en ligne par mégarde.
 */
export const LEGAL = {
  fr: {
    'mentions-legales': {
      title: 'Mentions légales',
      lede: 'Qui édite THIGA et où le service est hébergé.',
      sections: [
        {
          h: 'Éditeur',
          p: [
            'THIGA est édité par [[raison sociale]], [[forme juridique]] au capital de [[montant]] MRU, dont le siège est situé [[adresse]], Nouakchott, Mauritanie.',
            'Registre du commerce : [[numéro RC]] · NIF : [[numéro NIF]].',
            'Contact : [[adresse e-mail de contact]] · [[numéro de téléphone]].',
            'Directeur de la publication : [[nom et fonction]].',
          ],
        },
        {
          h: 'Hébergement',
          p: [
            'Le site est servi par [[Netlify, Inc. ou Vercel Inc. — selon l’hébergeur retenu]].',
            'Les comptes, profils, annonces, documents et fichiers sont stockés par Supabase, Inc. ([[adresse de l’hébergeur, à reprendre de supabase.com/privacy]]), dans un centre de données situé en Irlande (Union européenne).',
          ],
        },
        {
          h: 'Propriété intellectuelle',
          p: [
            'Le nom THIGA, son logo et la présentation du site appartiennent à l’éditeur. Les contenus publiés par les utilisateurs (profils, annonces, photos, avis) restent leur propriété ; en les publiant, ils autorisent THIGA à les afficher sur la plateforme.',
          ],
        },
        {
          h: 'Signaler un contenu',
          p: [
            'Chaque annonce et chaque profil porte un bouton « Signaler ». Pour toute autre demande, écrivez à [[adresse e-mail de contact]].',
          ],
        },
      ],
    },

    confidentialite: {
      title: 'Politique de confidentialité',
      lede: 'Les données que THIGA collecte, qui peut les voir et comment exercer vos droits.',
      sections: [
        {
          h: 'Responsable du traitement',
          p: [
            '[[raison sociale]], [[adresse]], Nouakchott. Contact pour vos données : [[adresse e-mail de contact]].',
            'Le traitement est conduit conformément à la loi mauritanienne n° 2017-020 relative à la protection des données à caractère personnel.',
          ],
        },
        {
          h: 'Données collectées',
          p: [
            'À l’inscription : nom, adresse e-mail, mot de passe (stocké chiffré, jamais lisible), rôle, ville et, si vous le donnez, numéro de téléphone.',
            'Selon votre usage : photo de profil, métier, expérience, compétences, langues, tarif, présentation, CV, pièce d’identité envoyée pour vérification, annonces, candidatures et leurs messages, avis donnés et reçus, signalements.',
          ],
        },
        {
          h: 'Qui voit quoi',
          p: [
            'Public : le profil d’un travailleur vérifié (nom, photo, métier, ville, expérience, présentation, tarif, avis reçus), les annonces validées et non expirées, les avis.',
            'Votre numéro de téléphone n’est jamais public. Il est communiqué à l’autre partie uniquement lorsqu’un employeur présélectionne ou embauche sur une candidature qui vous relie.',
            'Votre CV n’est visible que par les employeurs à qui vous l’avez envoyé avec une candidature, par des liens temporaires.',
            'Votre pièce d’identité n’est visible que par l’équipe d’administration, pour la vérification.',
          ],
        },
        {
          h: 'Finalités',
          p: [
            'Mettre en relation employeurs et travailleurs ; vérifier les identités ; modérer les annonces et les signalements ; vous prévenir des suites données à vos candidatures et à vos demandes ; assurer la sécurité du service.',
            'Vos données ne sont ni vendues ni utilisées à des fins publicitaires.',
          ],
        },
        {
          h: 'Hébergement et durée de conservation',
          p: [
            'Les données sont stockées par Supabase dans un centre de données en Irlande (Union européenne).',
            'Elles sont conservées tant que votre compte est actif, puis [[durée]] après sa suppression. Les pièces d’identité sont conservées [[durée]] après la décision de vérification.',
          ],
        },
        {
          h: 'Vos droits',
          p: [
            'Vous pouvez modifier vos informations et votre photo à tout moment depuis vos paramètres. Pour obtenir une copie de vos données, les faire corriger ou supprimer votre compte, écrivez à [[adresse e-mail de contact]] ; une réponse vous est apportée sous [[délai]].',
          ],
        },
        {
          h: 'Cookies et stockage local',
          p: [
            'THIGA n’utilise aucun cookie publicitaire ni outil de mesure d’audience. Le navigateur conserve seulement votre session de connexion, la langue choisie et les notifications déjà lues.',
          ],
        },
      ],
    },

    conditions: {
      title: 'Conditions d’utilisation',
      lede: 'Les règles qui s’appliquent à tous les utilisateurs de THIGA.',
      sections: [
        {
          h: 'Le service',
          p: [
            'THIGA met en relation des employeurs (particuliers, familles, entreprises) et des travailleurs de services en Mauritanie. THIGA n’est pas l’employeur : le contrat de travail, la rémunération et les conditions d’emploi sont convenus directement entre les parties, dans le respect du Code du travail mauritanien.',
            'L’inscription et l’utilisation sont gratuites pour les deux parties.',
          ],
        },
        {
          h: 'Votre compte',
          p: [
            'Vous vous engagez à fournir des informations exactes et à garder votre mot de passe confidentiel. Un compte est personnel.',
            'Le badge « vérifié » signifie qu’une pièce d’identité a été contrôlée par l’équipe. Un profil de travailleur n’apparaît dans l’annuaire qu’une fois vérifié.',
          ],
        },
        {
          h: 'Annonces et candidatures',
          p: [
            'Chaque annonce est validée par l’équipe avant publication et doit décrire un emploi réel, avec une rémunération honnête. Une annonce peut porter une date limite, après laquelle elle n’accepte plus de candidatures.',
            'Le numéro de téléphone des parties est échangé lorsqu’une candidature est présélectionnée.',
          ],
        },
        {
          h: 'Avis',
          p: [
            'Seules les parties d’une embauche enregistrée sur THIGA peuvent se noter. Un avis doit relater une expérience réelle, sans injure, propos discriminatoire ni information personnelle d’autrui. L’équipe peut retirer un avis qui ne respecte pas ces règles.',
          ],
        },
        {
          h: 'Comportements interdits',
          p: [
            'Fausses annonces ou faux profils ; demande d’argent à un candidat pour accéder à un emploi ; harcèlement ; contenu trompeur, discriminatoire ou illégal ; utilisation des coordonnées obtenues à d’autres fins que l’emploi concerné.',
            'Tout manquement peut entraîner le retrait du contenu et la suspension du compte.',
          ],
        },
        {
          h: 'Responsabilité',
          p: [
            'THIGA vérifie les identités et modère les annonces, mais ne garantit ni la qualité d’un travail ni le comportement d’un utilisateur. Restez vigilant : ne versez jamais d’argent pour obtenir un emploi et signalez tout abus.',
          ],
        },
        {
          h: 'Modification et droit applicable',
          p: [
            'Ces conditions peuvent évoluer ; la date de mise à jour figure en haut de la page. Elles sont régies par le droit mauritanien ; tout litige relève des tribunaux de [[ville du tribunal compétent]].',
          ],
        },
      ],
    },
  },

  ar: {
    'mentions-legales': {
      title: 'الإشعارات القانونية',
      lede: 'الجهة الناشرة لمنصة ثيغا ومكان استضافة الخدمة.',
      sections: [
        {
          h: 'الناشر',
          p: [
            'تنشر منصة ثيغا شركة [[الاسم التجاري]]، [[الشكل القانوني]] برأس مال قدره [[المبلغ]] أوقية، ومقرها [[العنوان]]، نواكشوط، موريتانيا.',
            'السجل التجاري: [[رقم السجل]] · الرقم الضريبي: [[الرقم الضريبي]].',
            'للتواصل: [[البريد الإلكتروني]] · [[رقم الهاتف]].',
            'مدير النشر: [[الاسم والصفة]].',
          ],
        },
        {
          h: 'الاستضافة',
          p: [
            'يُقدَّم الموقع عبر [[Netlify أو Vercel — حسب المستضيف المعتمد]].',
            'تُخزَّن الحسابات والملفات والعروض والوثائق لدى شركة Supabase, Inc. ‏([[عنوان المستضيف كما يرد في supabase.com/privacy]]) في مركز بيانات في أيرلندا (الاتحاد الأوروبي).',
          ],
        },
        {
          h: 'الملكية الفكرية',
          p: [
            'اسم ثيغا وشعارها وتصميم الموقع ملك للناشر. أما المحتوى الذي ينشره المستخدمون (الملفات، العروض، الصور، التقييمات) فيبقى ملكًا لهم، ويأذنون بنشره لثيغا بعرضه على المنصة.',
          ],
        },
        {
          h: 'الإبلاغ عن محتوى',
          p: [
            'في كل عرض وكل ملف زر «إبلاغ». ولأي طلب آخر راسلونا على [[البريد الإلكتروني]].',
          ],
        },
      ],
    },

    confidentialite: {
      title: 'سياسة الخصوصية',
      lede: 'البيانات التي تجمعها ثيغا، ومن يستطيع رؤيتها، وكيف تمارس حقوقك.',
      sections: [
        {
          h: 'المسؤول عن المعالجة',
          p: [
            '[[الاسم التجاري]]، [[العنوان]]، نواكشوط. للتواصل بشأن بياناتك: [[البريد الإلكتروني]].',
            'تتم المعالجة وفقًا للقانون الموريتاني رقم 2017-020 المتعلق بحماية البيانات ذات الطابع الشخصي.',
          ],
        },
        {
          h: 'البيانات المجمَّعة',
          p: [
            'عند التسجيل: الاسم، البريد الإلكتروني، كلمة المرور (مخزنة مشفرة ولا يمكن قراءتها)، الدور، المدينة، ورقم الهاتف إن قدّمته.',
            'حسب استعمالك: صورة الملف، المهنة، الخبرة، المهارات، اللغات، الأجر، النبذة، السيرة الذاتية، وثيقة الهوية المرسلة للتحقق، العروض، الطلبات ورسائلها، التقييمات المقدَّمة والمستلمة، البلاغات.',
          ],
        },
        {
          h: 'من يرى ماذا',
          p: [
            'للعموم: ملف العامل الموثَّق (الاسم، الصورة، المهنة، المدينة، الخبرة، النبذة، الأجر، التقييمات)، العروض المصادق عليها وغير المنتهية، والتقييمات.',
            'رقم هاتفك لا يُنشر أبدًا للعموم، ولا يُبلَّغ للطرف الآخر إلا عندما يقبل صاحب العمل مبدئيًا أو يوظّف على طلب يجمعكما.',
            'سيرتك الذاتية لا يراها إلا أصحاب العمل الذين أرسلتها إليهم مع طلب، عبر روابط مؤقتة.',
            'وثيقة هويتك لا يراها إلا فريق الإدارة لغرض التحقق.',
          ],
        },
        {
          h: 'الأغراض',
          p: [
            'الوساطة بين أصحاب العمل والعمال؛ التحقق من الهويات؛ مراقبة العروض والبلاغات؛ إعلامك بمآل طلباتك؛ ضمان أمن الخدمة.',
            'لا تُباع بياناتك ولا تُستعمل لأغراض إعلانية.',
          ],
        },
        {
          h: 'الاستضافة ومدة الحفظ',
          p: [
            'تُخزَّن البيانات لدى Supabase في مركز بيانات في أيرلندا (الاتحاد الأوروبي).',
            'تُحفظ ما دام حسابك نشطًا، ثم [[المدة]] بعد حذفه. وتُحفظ وثائق الهوية [[المدة]] بعد قرار التحقق.',
          ],
        },
        {
          h: 'حقوقك',
          p: [
            'يمكنك تعديل معلوماتك وصورتك في أي وقت من الإعدادات. وللحصول على نسخة من بياناتك أو تصحيحها أو حذف حسابك، راسلنا على [[البريد الإلكتروني]]؛ ويصلك الرد خلال [[المهلة]].',
          ],
        },
        {
          h: 'ملفات تعريف الارتباط والتخزين المحلي',
          p: [
            'لا تستعمل ثيغا أي ملفات تعريف ارتباط إعلانية ولا أدوات لقياس الزيارات. يحتفظ المتصفح فقط بجلسة الدخول واللغة المختارة والإشعارات المقروءة.',
          ],
        },
      ],
    },

    conditions: {
      title: 'شروط الاستخدام',
      lede: 'القواعد المطبقة على جميع مستخدمي ثيغا.',
      sections: [
        {
          h: 'الخدمة',
          p: [
            'تربط ثيغا بين أصحاب العمل (أفراد، أسر، شركات) وعمال الخدمات في موريتانيا. وثيغا ليست صاحب العمل: يتفق الطرفان مباشرة على عقد العمل والأجر وظروفه، في احترام لمدونة الشغل الموريتانية.',
            'التسجيل والاستعمال مجانيان للطرفين.',
          ],
        },
        {
          h: 'حسابك',
          p: [
            'تلتزم بتقديم معلومات صحيحة وبالحفاظ على سرية كلمة مرورك. الحساب شخصي.',
            'تعني شارة «موثَّق» أن الفريق تحقق من وثيقة هوية. ولا يظهر ملف العامل في الدليل إلا بعد توثيقه.',
          ],
        },
        {
          h: 'العروض والطلبات',
          p: [
            'يصادق الفريق على كل عرض قبل نشره، ويجب أن يصف عملًا حقيقيًا بأجر صادق. ويمكن أن يحمل العرض آخر أجل لا يقبل بعده طلبات جديدة.',
            'يُتبادل رقم هاتف الطرفين عندما يُقبل الطلب مبدئيًا.',
          ],
        },
        {
          h: 'التقييمات',
          p: [
            'لا يقيّم إلا طرفا توظيف مسجَّل على ثيغا. ويجب أن يروي التقييم تجربة حقيقية دون سب أو تمييز أو معلومات شخصية عن الغير. ويمكن للفريق حذف كل تقييم مخالف لهذه القواعد.',
          ],
        },
        {
          h: 'السلوكيات الممنوعة',
          p: [
            'العروض أو الملفات الكاذبة؛ مطالبة المترشح بمال مقابل الحصول على عمل؛ التحرش؛ المحتوى المضلِّل أو التمييزي أو غير القانوني؛ استعمال معلومات الاتصال لغير العمل المعني.',
            'قد تؤدي كل مخالفة إلى حذف المحتوى وتعليق الحساب.',
          ],
        },
        {
          h: 'المسؤولية',
          p: [
            'تتحقق ثيغا من الهويات وتراقب العروض، لكنها لا تضمن جودة العمل ولا سلوك المستخدمين. كن يقظًا: لا تدفع مالًا أبدًا للحصول على عمل، وأبلغ عن كل تجاوز.',
          ],
        },
        {
          h: 'التعديل والقانون المطبق',
          p: [
            'قد تتغير هذه الشروط، ويظهر تاريخ آخر تحديث أعلى الصفحة. وتخضع للقانون الموريتاني، ويختص بكل نزاع قضاء [[مدينة المحكمة المختصة]].',
          ],
        },
      ],
    },
  },
}

/** Date de dernière mise à jour affichée en tête de chaque page. */
export const LEGAL_UPDATED = '2026-10-11'
