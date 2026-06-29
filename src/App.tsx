import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { Download, Link as LinkIcon, Loader2, AlertCircle, CheckCircle2, Globe, FileVideo, Music, Clock, User, HardDrive, Play, Copy, Check, Menu, X } from 'lucide-react';

const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Cookies = lazy(() => import('./pages/Cookies'));
const Dmca = lazy(() => import('./pages/Dmca'));
const Faq = lazy(() => import('./pages/Faq'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const NotFound = lazy(() => import('./pages/NotFound'));

const languagesList = [
  { code: 'ar', name: 'العربية', dir: 'rtl' },
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'fr', name: 'Français', dir: 'ltr' },
  { code: 'es', name: 'Español', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', dir: 'ltr' },
  { code: 'zh', name: '中文', dir: 'ltr' },
  { code: 'ja', name: '日本語', dir: 'ltr' },
  { code: 'ru', name: 'Русский', dir: 'ltr' },
  { code: 'pt', name: 'Português', dir: 'ltr' },
  { code: 'hi', name: 'हिन्दी', dir: 'ltr' },
  { code: 'it', name: 'Italiano', dir: 'ltr' },
  { code: 'ko', name: '한국어', dir: 'ltr' },
  { code: 'tr', name: 'Türkçe', dir: 'ltr' },
  { code: 'nl', name: 'Nederlands', dir: 'ltr' },
  { code: 'pl', name: 'Polski', dir: 'ltr' },
  { code: 'sv', name: 'Svenska', dir: 'ltr' },
  { code: 'no', name: 'Norsk', dir: 'ltr' },
  { code: 'da', name: 'Dansk', dir: 'ltr' },
  { code: 'fi', name: 'Suomi', dir: 'ltr' },
  { code: 'el', name: 'Ελληνικά', dir: 'ltr' }
];

const translations: Record<string, any> = {
  ar: { title: 'NexoraVid', subtitle: 'حمل فيديوهاتك المفضلة من يوتيوب وتيك توك وأكثر من 20 منصة.', placeholder: 'الصق رابط الفيديو هنا...', downloadBtn: 'تحميل الآن', processing: 'جاري المعالجة...', invalidUrl: 'الرجاء إدخال رابط صحيح.', networkError: 'حدث خطأ في الاتصال.', success: 'تم جلب معلومات الفيديو بنجاح!', videoInfo: 'معلومات الفيديو', duration: 'المدة:', uploader: 'الناشر:', platform: 'المنصة:', downloadOptions: 'الصيغ المتاحة', downloadAction: 'تحميل', downloadingState: 'جاري التحميل...', downloadComplete: 'تم التحميل!', footer: 'NexoraVid - يعمل مع 20+ منصة – خصوصيتك محفوظة', selectLang: 'اختر اللغة', audioOnly: 'صوت', noFormats: 'لا توجد صيغ متاحة', downloadFailed: 'فشل التحميل. يرجى المحاولة مرة أخرى.', previewBtn: 'معاينة', copyLinkBtn: 'نسخ', linkCopied: 'تم النسخ!', legalMessage: 'عن طريق التحميل، أنت توافق على شروط الاستخدام وتؤكد أن لديك الإذن لتحميل هذا المحتوى.' },
  en: { title: 'NexoraVid', subtitle: 'Download from YouTube, TikTok and 20+ platforms.', placeholder: 'Paste video link here...', downloadBtn: 'Download Now', processing: 'Processing...', invalidUrl: 'Please enter a valid URL.', networkError: 'Network error.', success: 'Video info retrieved!', videoInfo: 'Video Information', duration: 'Duration:', uploader: 'Uploader:', platform: 'Platform:', downloadOptions: 'Available Formats', downloadAction: 'Download', downloadingState: 'Downloading...', downloadComplete: 'Download Complete!', footer: 'NexoraVid - Works with 20+ platforms – Privacy respected', selectLang: 'Select Language', audioOnly: 'Audio', noFormats: 'No formats available', downloadFailed: 'Download failed. Please try again.', previewBtn: 'Preview', copyLinkBtn: 'Copy', linkCopied: 'Copied!', legalMessage: 'By downloading, you agree to our Terms of Service and acknowledge you have permission to download this content.' },
  fr: { title: 'NexoraVid', subtitle: 'Téléchargez depuis YouTube, TikTok et 20+ plateformes.', placeholder: 'Collez le lien de la vidéo ici...', downloadBtn: 'Télécharger', processing: 'Traitement...', invalidUrl: 'Veuillez entrer une URL valide.', networkError: 'Erreur réseau.', success: 'Infos vidéo récupérées !', videoInfo: 'Informations Vidéo', duration: 'Durée :', uploader: 'Auteur :', platform: 'Plateforme :', downloadOptions: 'Formats Disponibles', downloadAction: 'Télécharger', downloadingState: 'Téléchargement...', downloadComplete: 'Téléchargement Terminé !', footer: 'NexoraVid - Fonctionne avec 20+ plateformes', selectLang: 'Choisir la Langue', audioOnly: 'Audio', noFormats: 'Aucun format disponible', downloadFailed: 'Échec du téléchargement.', previewBtn: 'Aperçu', copyLinkBtn: 'Copier', linkCopied: 'Copié !', legalMessage: 'En téléchargeant, vous acceptez nos conditions d\'utilisation et confirmez avoir l\'autorisation de télécharger ce contenu.' },
  es: { title: 'NexoraVid', subtitle: 'Descarga de YouTube, TikTok y 20+ plataformas.', placeholder: 'Pega el enlace del video aquí...', downloadBtn: 'Descargar Ahora', processing: 'Procesando...', invalidUrl: 'Ingrese una URL válida.', networkError: 'Error de red.', success: '¡Información obtenida!', videoInfo: 'Información del Video', duration: 'Duración:', uploader: 'Autor:', platform: 'Plataforma:', downloadOptions: 'Formatos Disponibles', downloadAction: 'Descargar', downloadingState: 'Descargando...', downloadComplete: '¡Descarga Completa!', footer: 'NexoraVid - Funciona con 20+ plataformas', selectLang: 'Seleccionar Idioma', audioOnly: 'Audio', noFormats: 'No hay formatos', downloadFailed: 'Descarga fallida.', previewBtn: 'Vista previa', copyLinkBtn: 'Copiar', linkCopied: '¡Copiado!', legalMessage: 'Al descargar, aceptas nuestros Términos de Servicio y confirmas que tienes permiso para descargar este contenido.' },
  de: { title: 'NexoraVid', subtitle: 'Lade von YouTube, TikTok und 20+ Plattformen herunter.', placeholder: 'Video-Link hier einfügen...', downloadBtn: 'Jetzt Herunterladen', processing: 'Verarbeitung...', invalidUrl: 'Bitte gültige URL eingeben.', networkError: 'Netzwerkfehler.', success: 'Video-Info abgerufen!', videoInfo: 'Video-Informationen', duration: 'Dauer:', uploader: 'Autor:', platform: 'Plattform:', downloadOptions: 'Verfügbare Formate', downloadAction: 'Herunterladen', downloadingState: 'Wird heruntergeladen...', downloadComplete: 'Download Abgeschlossen!', footer: 'NexoraVid - Funktioniert mit 20+ Plattformen', selectLang: 'Sprache wählen', audioOnly: 'Audio', noFormats: 'Keine Formate', downloadFailed: 'Download fehlgeschlagen.', previewBtn: 'Vorschau', copyLinkBtn: 'Kopieren', linkCopied: 'Kopiert!', legalMessage: 'Mit dem Herunterladen stimmen Sie unseren Nutzungsbedingungen zu und bestätigen, dass Sie die Erlaubnis haben, diesen Inhalt herunterzuladen.' },
  zh: { title: 'NexoraVid', subtitle: '从YouTube、TikTok和20多个平台下载。', placeholder: '在此粘贴视频链接...', downloadBtn: '立即下载', processing: '处理中...', invalidUrl: '请输入有效的URL。', networkError: '网络错误。', success: '获取视频信息成功！', videoInfo: '视频信息', duration: '时长:', uploader: '上传者:', platform: '平台:', downloadOptions: '可用格式', downloadAction: '下载', downloadingState: '下载中...', downloadComplete: '下载完成！', footer: 'NexoraVid - 支持20多个平台', selectLang: '选择语言', audioOnly: '音频', noFormats: '没有可用格式', downloadFailed: '下载失败。', previewBtn: '预览', copyLinkBtn: '复制', linkCopied: '已复制！', legalMessage: '下载即表示您同意我们的服务条款，并承认您有权下载此内容。' },
  ja: { title: 'NexoraVid', subtitle: 'YouTube、TikTok、20以上のプラットフォームからダウンロード。', placeholder: 'ここにビデオリンクを貼り付け...', downloadBtn: '今すぐダウンロード', processing: '処理中...', invalidUrl: '有効なURLを入力してください。', networkError: 'ネットワークエラー。', success: 'ビデオ情報を取得しました！', videoInfo: 'ビデオ情報', duration: '時間:', uploader: 'アップローダー:', platform: 'プラットフォーム:', downloadOptions: '利用可能なフォーマット', downloadAction: 'ダウンロード', downloadingState: 'ダウンロード中...', downloadComplete: 'ダウンロード完了！', footer: 'NexoraVid - 20以上のプラットフォームで動作します', selectLang: '言語を選択', audioOnly: 'オーディオ', noFormats: 'フォーマットがありません', downloadFailed: 'ダウンロード失敗。', previewBtn: 'プレビュー', copyLinkBtn: 'コピー', linkCopied: 'コピーしました！', legalMessage: 'ダウンロードすることにより、利用規約に同意し、このコンテンツをダウンロードする許可を得ていることを確認したことになります。' },
  ru: { title: 'NexoraVid', subtitle: 'Скачивайте с YouTube, TikTok и более 20 платформ.', placeholder: 'Вставьте ссылку на видео...', downloadBtn: 'Скачать сейчас', processing: 'Обработка...', invalidUrl: 'Введите действительный URL.', networkError: 'Ошибка сети.', success: 'Информация получена!', videoInfo: 'Информация о видео', duration: 'Длительность:', uploader: 'Автор:', platform: 'Платформа:', downloadOptions: 'Доступные форматы', downloadAction: 'Скачать', downloadingState: 'Скачивание...', downloadComplete: 'Скачивание завершено!', footer: 'NexoraVid - Работает с 20+ платформами', selectLang: 'Выберите язык', audioOnly: 'Аудио', noFormats: 'Нет форматов', downloadFailed: 'Ошибка скачивания.', previewBtn: 'Предпросмотр', copyLinkBtn: 'Копировать', linkCopied: 'Скопировано!', legalMessage: 'Скачивая, вы соглашаетесь с нашими Условиями использования и подтверждаете, что у вас есть разрешение на скачивание этого контента.' },
  pt: { title: 'NexoraVid', subtitle: 'Baixe do YouTube, TikTok e mais de 20 plataformas.', placeholder: 'Cole o link do vídeo aqui...', downloadBtn: 'Baixar Agora', processing: 'Processando...', invalidUrl: 'Insira um URL válido.', networkError: 'Erro de rede.', success: 'Informações obtidas!', videoInfo: 'Informações do Vídeo', duration: 'Duração:', uploader: 'Autor:', platform: 'Plataforma:', downloadOptions: 'Formatos Disponíveis', downloadAction: 'Baixar', downloadingState: 'Baixando...', downloadComplete: 'Download Concluído!', footer: 'NexoraVid - Funciona com 20+ plataformas', selectLang: 'Selecionar Idioma', audioOnly: 'Áudio', noFormats: 'Sem formatos', downloadFailed: 'Falha no download.', previewBtn: 'Visualizar', copyLinkBtn: 'Copiar', linkCopied: 'Copiado!', legalMessage: 'Ao baixar, você concorda com nossos Termos de Serviço e reconhece que tem permissão para baixar este conteúdo.' },
  hi: { title: 'NexoraVid', subtitle: 'YouTube, TikTok और 20+ प्लेटफार्मों से डाउनलोड करें।', placeholder: 'वीडियो लिंक यहां पेस्ट करें...', downloadBtn: 'अभी डाउनलोड करें', processing: 'प्रोसेस हो रहा है...', invalidUrl: 'कृपया एक मान्य URL दर्ज करें।', networkError: 'नेटवर्क त्रुटि।', success: 'वीडियो जानकारी प्राप्त की गई!', videoInfo: 'वीडियो जानकारी', duration: 'अवधि:', uploader: 'अपलोडर:', platform: 'प्लेटफ़ॉर्म:', downloadOptions: 'उपलब्ध स्वरूप', downloadAction: 'डाउनलोड', downloadingState: 'डाउनलोड हो रहा है...', downloadComplete: 'डाउनलोड पूर्ण!', footer: 'NexoraVid - 20+ प्लेटफार्मों के साथ काम करता है', selectLang: 'भाषा चुनें', audioOnly: 'ऑडियो', noFormats: 'कोई स्वरूप उपलब्ध नहीं है', downloadFailed: 'डाउनलोड विफल।', previewBtn: 'पूर्वावलोकन', copyLinkBtn: 'कॉपी', linkCopied: 'कॉपी हो गया!', legalMessage: 'डाउनलोड करके, आप हमारी सेवा की शर्तों से सहमत हैं और स्वीकार करते हैं कि आपके पास इस सामग्री को डाउनलोड करने की अनुमति है।' },
  it: { title: 'NexoraVid', subtitle: 'Scarica da YouTube, TikTok e oltre 20 piattaforme.', placeholder: 'Incolla qui il link del video...', downloadBtn: 'Scarica Ora', processing: 'Elaborazione...', invalidUrl: 'Inserisci un URL valido.', networkError: 'Errore di rete.', success: 'Informazioni recuperate!', videoInfo: 'Informazioni Video', duration: 'Durata:', uploader: 'Autore:', platform: 'Piattaforma:', downloadOptions: 'Formati Disponibili', downloadAction: 'Scarica', downloadingState: 'Scaricamento...', downloadComplete: 'Download Completato!', footer: 'NexoraVid - Funziona con 20+ piattaforme', selectLang: 'Seleziona Lingua', audioOnly: 'Audio', noFormats: 'Nessun formato', downloadFailed: 'Download fallito.', previewBtn: 'Anteprima', copyLinkBtn: 'Copia', linkCopied: 'Copiato!', legalMessage: 'Scaricando, accetti i nostri Termini di Servizio e confermi di avere il permesso per scaricare questo contenuto.' },
  ko: { title: 'NexoraVid', subtitle: 'YouTube, TikTok 및 20개 이상의 플랫폼에서 다운로드하세요.', placeholder: '비디오 링크 붙여넣기...', downloadBtn: '지금 다운로드', processing: '처리 중...', invalidUrl: '유효한 URL을 입력하세요.', networkError: '네트워크 오류.', success: '비디오 정보를 가져왔습니다!', videoInfo: '비디오 정보', duration: '시간:', uploader: '업로더:', platform: '플랫폼:', downloadOptions: '사용 가능한 형식', downloadAction: '다운로드', downloadingState: '다운로드 중...', downloadComplete: '다운로드 완료!', footer: 'NexoraVid - 20개 이상의 플랫폼에서 작동', selectLang: '언어 선택', audioOnly: '오디오', noFormats: '형식 없음', downloadFailed: '다운로드 실패.', previewBtn: '미리보기', copyLinkBtn: '복사', linkCopied: '복사됨!', legalMessage: '다운로드함으로써 귀하는 서비스 약관에 동의하고 이 콘텐츠를 다운로드할 수 있는 권한이 있음을 인정합니다.' },
  tr: { title: 'NexoraVid', subtitle: 'YouTube, TikTok ve 20+ platformdan indirin.', placeholder: 'Video bağlantısını buraya yapıştırın...', downloadBtn: 'Şimdi İndir', processing: 'İşleniyor...', invalidUrl: 'Lütfen geçerli bir URL girin.', networkError: 'Ağ hatası.', success: 'Video bilgileri alındı!', videoInfo: 'Video Bilgileri', duration: 'Süre:', uploader: 'Yükleyici:', platform: 'Platform:', downloadOptions: 'Mevcut Formatlar', downloadAction: 'İndir', downloadingState: 'İndiriliyor...', downloadComplete: 'İndirme Tamamlandı!', footer: 'NexoraVid - 20+ platformla çalışır', selectLang: 'Dil Seç', audioOnly: 'Ses', noFormats: 'Format yok', downloadFailed: 'İndirme başarısız.', previewBtn: 'Önizleme', copyLinkBtn: 'Kopyala', linkCopied: 'Kopyalandı!', legalMessage: 'İndirerek, Hizmet Şartlarımızı kabul etmiş ve bu içeriği indirme izniniz olduğunu onaylamış olursunuz.' },
  nl: { title: 'NexoraVid', subtitle: 'Download van YouTube, TikTok en 20+ platforms.', placeholder: 'Plak videolink hier...', downloadBtn: 'Nu Downloaden', processing: 'Verwerken...', invalidUrl: 'Voer een geldige URL in.', networkError: 'Netwerkfout.', success: 'Video-info opgehaald!', videoInfo: 'Video-informatie', duration: 'Duur:', uploader: 'Auteur:', platform: 'Platform:', downloadOptions: 'Beschikbare Formaten', downloadAction: 'Downloaden', downloadingState: 'Downloaden...', downloadComplete: 'Download Voltooid!', footer: 'NexoraVid - Werkt met 20+ platforms', selectLang: 'Selecteer Taal', audioOnly: 'Audio', noFormats: 'Geen formaten', downloadFailed: 'Download mislukt.', previewBtn: 'Voorbeeld', copyLinkBtn: 'Kopiëren', linkCopied: 'Gekopieerd!', legalMessage: 'Door te downloaden gaat u akkoord met onze Servicevoorwaarden en erkent u dat u toestemming heeft om deze inhoud te downloaden.' },
  pl: { title: 'NexoraVid', subtitle: 'Pobieraj z YouTube, TikTok i 20+ platform.', placeholder: 'Wklej link do wideo tutaj...', downloadBtn: 'Pobierz Teraz', processing: 'Przetwarzanie...', invalidUrl: 'Wprowadź prawidłowy URL.', networkError: 'Błąd sieci.', success: 'Informacje o wideo pobrane!', videoInfo: 'Informacje o Wideo', duration: 'Czas trwania:', uploader: 'Autor:', platform: 'Platforma:', downloadOptions: 'Dostępne Formaty', downloadAction: 'Pobierz', downloadingState: 'Pobieranie...', downloadComplete: 'Pobieranie Zakończone!', footer: 'NexoraVid - Działa z 20+ platformami', selectLang: 'Wybierz Język', audioOnly: 'Dźwięk', noFormats: 'Brak formatów', downloadFailed: 'Pobieranie nie powiodło się.', previewBtn: 'Podgląd', copyLinkBtn: 'Kopiuj', linkCopied: 'Skopiowano!', legalMessage: 'Pobierając, akceptujesz nasz Regulamin i potwierdzasz, że masz pozwolenie na pobranie tej treści.' },
  sv: { title: 'NexoraVid', subtitle: 'Ladda ner från YouTube, TikTok och 20+ plattformar.', placeholder: 'Klistra in videolänk här...', downloadBtn: 'Ladda Ner Nu', processing: 'Bearbetar...', invalidUrl: 'Ange en giltig URL.', networkError: 'Nätverksfel.', success: 'Videoinformation hämtad!', videoInfo: 'Videoinformation', duration: 'Varaktighet:', uploader: 'Uppladdare:', platform: 'Plattform:', downloadOptions: 'Tillgängliga Format', downloadAction: 'Ladda Ner', downloadingState: 'Laddar ner...', downloadComplete: 'Nedladdning Klar!', footer: 'NexoraVid - Fungerar med 20+ plattformar', selectLang: 'Välj Språk', audioOnly: 'Ljud', noFormats: 'Inga format', downloadFailed: 'Nedladdning misslyckades.', previewBtn: 'Förhandsvisa', copyLinkBtn: 'Kopier', linkCopied: 'Kopierad!', legalMessage: 'Genom att ladda ner godkänner du våra användarvillkor och bekräftar att du har tillåtelse att ladda ner detta innehåll.' },
  no: { title: 'NexoraVid', subtitle: 'Last ned fra YouTube, TikTok og 20+ plattformer.', placeholder: 'Lim inn videolenke her...', downloadBtn: 'Last Ned Nå', processing: 'Behandler...', invalidUrl: 'Angi en gyldig URL.', networkError: 'Nettverksfeil.', success: 'Videoinfo hentet!', videoInfo: 'Videoinformasjon', duration: 'Varighet:', uploader: 'Opplaster:', platform: 'Plattform:', downloadOptions: 'Tilgjengelige Formater', downloadAction: 'Last Ned', downloadingState: 'Laster ned...', downloadComplete: 'Nedlasting Fullført!', footer: 'NexoraVid - Fungerer med 20+ plattformer', selectLang: 'Velg Språk', audioOnly: 'Lyd', noFormats: 'Ingen formater', downloadFailed: 'Nedlasting mislyktes.', previewBtn: 'Forhåndsvisning', copyLinkBtn: 'Kopier', linkCopied: 'Kopiert!', legalMessage: 'Ved å laste ned godtar du våre vilkår for bruk og bekrefter at du har tillatelse til å laste ned dette innholdet.' },
  da: { title: 'NexoraVid', subtitle: 'Download fra YouTube, TikTok og 20+ platforme.', placeholder: 'Indsæt videolink her...', downloadBtn: 'Download Nu', processing: 'Behandler...', invalidUrl: 'Indtast en gyldig URL.', networkError: 'Netværksfejl.', success: 'Videoinfo hentet!', videoInfo: 'Videoinformation', duration: 'Varighed:', uploader: 'Uploader:', platform: 'Platform:', downloadOptions: 'Tilgængelige Formater', downloadAction: 'Download', downloadingState: 'Downloader...', downloadComplete: 'Download Udført!', footer: 'NexoraVid - Fungerer med 20+ platforme', selectLang: 'Vælg Sprog', audioOnly: 'Lyd', noFormats: 'Ingen formater', downloadFailed: 'Download mislykkedes.', previewBtn: 'Forhåndsvisning', copyLinkBtn: 'Kopier', linkCopied: 'Kopieret!', legalMessage: 'Ved at downloade accepterer du vores servicevilkår og bekræfter, at du har tilladelse til at downloade dette indhold.' },
  fi: { title: 'NexoraVid', subtitle: 'Lataa YouTubesta, TikTokista ja yli 20 alustalta.', placeholder: 'Liitä videolinkki tähän...', downloadBtn: 'Lataa Nyt', processing: 'Käsitellään...', invalidUrl: 'Syötä kelvollinen URL.', networkError: 'Verkkovirhe.', success: 'Videon tiedot haettu!', videoInfo: 'Videon Tiedot', duration: 'Kesto:', uploader: 'Lataaja:', platform: 'Alusta:', downloadOptions: 'Saatavilla olevat Formaatit', downloadAction: 'Lataa', downloadingState: 'Ladataan...', downloadComplete: 'Lataus Valmis!', footer: 'NexoraVid - Toimii yli 20 alustalla', selectLang: 'Valitse Kieli', audioOnly: 'Ääni', noFormats: 'Ei formaatteja', downloadFailed: 'Lataus epäonnistui.', previewBtn: 'Esikatselu', copyLinkBtn: 'Kopioi', linkCopied: 'Kopioitu!', legalMessage: 'Lataamalla hyväksyt käyttöehtomme ja vahvistat, että sinulla on lupa ladata tämä sisältö.' },
  el: { title: 'NexoraVid', subtitle: 'Λήψη από YouTube, TikTok και 20+ πλατφόρμες.', placeholder: 'Επικολλήστε το σύνδεσμο βίντεο...', downloadBtn: 'Λήψη Τώρα', processing: 'Επεξεργασία...', invalidUrl: 'Εισαγάγετε έγκυρο URL.', networkError: 'Σφάλμα δικτύου.', success: 'Πληροφορίες ανακτήθηκαν!', videoInfo: 'Πληροφορίες Βίντεο', duration: 'Διάρκεια:', uploader: 'Χρήστης:', platform: 'Πλατφόρμα:', downloadOptions: 'Διαθέσιμες Μορφές', downloadAction: 'Λήψη', downloadingState: 'Λήψη...', downloadComplete: 'Λήψη Ολοκληρώθηκε!', footer: 'NexoraVid - Λειτουργεί με 20+ πλατφόρμες', selectLang: 'Επιλογή Γλώσσας', audioOnly: 'Ήχος', noFormats: 'Δεν υπάρχουν μορφές', downloadFailed: 'Η λήψη απέτυχε.', previewBtn: 'Προεπισκόπηση', copyLinkBtn: 'Αντιγραφή', linkCopied: 'Αντιγράφηκε!', legalMessage: 'Με τη λήψη, αποδέχεστε τους Όρους Παροχής Υπηρεσιών μας και επιβεβαιώνετε ότι έχετε άδεια να κατεβάσετε αυτό το περιεχόμενο.' }
};

type VideoFormat = {
  format_id: string;
  ext: string;
  resolution: string;
  filesize: number;
  vcodec: boolean;
  acodec: boolean;
  format_note: string;
};

type VideoInfo = {
  title: string;
  thumbnail: string;
  duration: number;
  uploader: string;
  extractor: string;
  formats: VideoFormat[];
};

function formatDuration(seconds: number) {
  if (!seconds) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function App() {
  const [langCode, setLangCode] = useState<string>(() => localStorage.getItem('appLang') || 'ar');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  
  // Download state
  const [downloadingFormatId, setDownloadingFormatId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{ loaded: number; total: number; percentage: number } | null>(null);

  // Preview state
  const [previewState, setPreviewState] = useState<'idle' | 'playing'>('idle');
  const [previewFormatId, setPreviewFormatId] = useState<string | null>(null);

  // Copy state
  const [copiedFormatId, setCopiedFormatId] = useState<string | null>(null);

  const currentLang = languagesList.find(l => l.code === langCode) || languagesList[0];
  const t = translations[langCode] || translations['en'];

  useEffect(() => {
    localStorage.setItem('appLang', langCode);
    document.documentElement.dir = currentLang.dir;
    document.documentElement.lang = currentLang.code;
  }, [langCode, currentLang]);

  const handleProcessUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setVideoInfo(null);
    setTaskId(null);
    setPreviewState('idle');
    setPreviewFormatId(null);

    const trimmedUrl = url.trim();
    if (!trimmedUrl || !trimmedUrl.startsWith('http')) {
      setError(t.invalidUrl);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmedUrl })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || t.networkError);
      } else {
        setVideoInfo(data.info);
        setTaskId(data.taskId);
      }
    } catch (err: any) {
      setError(t.networkError);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format: VideoFormat) => {
    if (!taskId || downloadingFormatId) return;
    
    setDownloadingFormatId(format.format_id);
    setDownloadProgress({ loaded: 0, total: format.filesize || 0, percentage: 0 });
    setError(null);
    
    try {
      const downloadUrl = `/api/download?taskId=${taskId}&formatId=${format.format_id}`;
      const response = await fetch(downloadUrl);
      
      if (!response.ok || !response.body) {
        throw new Error('Download failed');
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : (format.filesize || 0);
      let loaded = 0;

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          loaded += value.length;
          setDownloadProgress({
            loaded,
            total: total > 0 ? total : loaded,
            percentage: total > 0 ? Math.round((loaded / total) * 100) : 100
          });
        }
      }

      // Convert chunks to Blob
      const blob = new Blob(chunks, { type: response.headers.get('content-type') || 'application/octet-stream' });
      const finalUrl = URL.createObjectURL(blob);
      
      // Cleanup video title for filename
      const cleanTitle = videoInfo?.title.replace(/[^\w\s\u0600-\u06FF-]/gi, '').trim().replace(/\s+/g, '_') || 'video';
      const filename = `${cleanTitle}.${format.ext}`;

      // Create hidden link and click
      const a = document.createElement('a');
      a.href = finalUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Free memory
      setTimeout(() => URL.revokeObjectURL(finalUrl), 10000);
      
    } catch (err) {
      console.error(err);
      setError(t.downloadFailed);
    } finally {
      setDownloadingFormatId(null);
      setDownloadProgress(null);
    }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <div className={`min-h-screen flex flex-col font-inter bg-slate-950 text-slate-50 overflow-x-hidden relative selection:bg-blue-500/30`}>
      {/* Background Gradients (Glassmorphism) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto p-4 md:p-6 flex justify-between items-center">
        <Link to="/" className="font-bold text-xl md:text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 hover:opacity-80 transition-opacity">
          NexoraVid
        </Link>
        
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <Link to="/" className="hover:text-blue-400 transition-colors">Home</Link>
          <Link to="/blog" className="hover:text-blue-400 transition-colors">Blog</Link>
          <Link to="/faq" className="hover:text-blue-400 transition-colors">FAQ</Link>
          
          <div className="relative group ml-4">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-medium backdrop-blur-md">
              <Globe className="w-4 h-4 text-blue-400" />
              {currentLang.name}
            </button>
            <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl p-2 hidden group-hover:block z-50 shadow-2xl max-h-64 overflow-y-auto custom-scrollbar">
              {languagesList.map(l => (
                <button
                  key={l.code}
                  onClick={() => setLangCode(l.code)}
                  className={`w-full text-start px-3 py-2 rounded-lg text-sm transition-colors ${langCode === l.code ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-slate-300 hover:text-white'}`}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button className="md:hidden p-2 text-slate-300" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden relative z-20 bg-slate-900 border-b border-white/10 overflow-hidden">
            <div className="flex flex-col p-4 gap-4">
              <Link to="/" className="text-slate-300 hover:text-blue-400 font-medium">Home</Link>
              <Link to="/blog" className="text-slate-300 hover:text-blue-400 font-medium">Blog</Link>
              <Link to="/faq" className="text-slate-300 hover:text-blue-400 font-medium">FAQ</Link>
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-slate-500 mb-2">Language</p>
                <div className="grid grid-cols-2 gap-2">
                  {languagesList.map(l => (
                    <button key={l.code} onClick={() => { setLangCode(l.code); setMobileMenuOpen(false); }} className={`text-start px-3 py-2 rounded-lg text-sm ${langCode === l.code ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-300'}`}>
                      {l.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="relative z-10 flex-1 w-full flex flex-col">
        <Suspense fallback={<div className="flex items-center justify-center p-24 text-blue-400"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        <Routes>
          <Route path="/" element={
            <>
              <Helmet>
                <title>{t.title} - Video Downloader</title>
                <meta name="description" content={t.subtitle} />
                <link rel="canonical" href="https://nexoravid.com/" />
                <script type="application/ld+json">
                  {`
                    {
                      "@context": "https://schema.org",
                      "@type": "WebApplication",
                      "name": "NexoraVid",
                      "description": "${t.subtitle}",
                      "applicationCategory": "MultimediaApplication",
                      "operatingSystem": "All"
                    }
                  `}
                </script>
              </Helmet>
              <div className="w-full max-w-4xl mx-auto px-6 py-12 flex flex-col items-center">
                
                {/* Hero Section */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                <div className="inline-flex items-center justify-center p-4 bg-white/5 border border-white/10 rounded-2xl mb-6 shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)] backdrop-blur-md">
                  <Download className="w-10 h-10 text-blue-400" />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight text-white drop-shadow-sm">
                  {t.title}
                </h1>
                <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-light">
                  {t.subtitle}
                </p>
                <p className="text-xs text-slate-500 mt-4 max-w-lg mx-auto">
                  {t.legalMessage}
                </p>
              </motion.div>

              {/* Input Form */}
              <motion.form 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                onSubmit={handleProcessUrl}
                className="w-full max-w-2xl relative mb-8 group"
              >
                <div className="relative flex items-center bg-white/5 border border-white/10 hover:border-white/20 focus-within:border-blue-500/50 focus-within:bg-white/10 rounded-2xl transition-all duration-300 backdrop-blur-md shadow-2xl overflow-hidden">
                  <div className={`absolute ${currentLang.dir === 'rtl' ? 'right-5' : 'left-5'} text-slate-400 pointer-events-none`}>
                    <LinkIcon className="w-6 h-6 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t.placeholder}
                    className={`w-full bg-transparent py-5 ${currentLang.dir === 'rtl' ? 'pr-14 pl-40' : 'pl-14 pr-40'} text-lg outline-none text-white placeholder-slate-500`}
                    disabled={loading}
                    dir="ltr"
                  />
                  <div className={`absolute ${currentLang.dir === 'rtl' ? 'left-2' : 'right-2'}`}>
                    <button
                      type="submit"
                      disabled={loading || !url.trim()}
                      className="bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-slate-500 text-white font-medium py-3 px-6 rounded-xl transition-all flex items-center gap-2 shadow-lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="hidden sm:inline">{t.processing}</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          <span className="hidden sm:inline">{t.downloadBtn}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.form>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full max-w-2xl bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 mb-8 backdrop-blur-md">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Results Area */}
              <AnimatePresence>
                {videoInfo && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 shadow-2xl">
                    
                    {/* Thumbnail & Basic Info */}
                    <div className="w-full md:w-1/3 flex flex-col gap-4">
                      <div className="relative rounded-2xl overflow-hidden aspect-video md:aspect-square shadow-lg bg-black/50 border border-white/10 group">
                        {previewState === 'playing' ? (
                           <video src={`/api/stream?taskId=${taskId}${previewFormatId ? '&formatId='+previewFormatId : ''}`} controls autoPlay className="w-full h-full object-contain bg-black" />
                        ) : videoInfo.thumbnail ? (
                          <img src={videoInfo.thumbnail} alt={videoInfo.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <FileVideo className="w-12 h-12" />
                          </div>
                        )}
                        {previewState !== 'playing' && (
                          <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 text-white/90">
                            <Clock className="w-3 h-3 text-blue-400" />
                            {formatDuration(videoInfo.duration)}
                          </div>
                        )}
                        {previewState !== 'playing' && (
                          <button onClick={() => setPreviewState('playing')} className="absolute inset-0 m-auto w-14 h-14 flex items-center justify-center bg-blue-500/80 hover:bg-blue-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-xl" title={t.previewBtn}>
                            <Play className="w-6 h-6 ml-1" />
                          </button>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-3 text-sm text-slate-300 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-blue-400 shrink-0" />
                          <span className="truncate">{videoInfo.uploader || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Globe className="w-4 h-4 text-purple-400 shrink-0" />
                          <span className="capitalize">{videoInfo.extractor}</span>
                        </div>
                      </div>
                    </div>

                    {/* Formats & Title */}
                    <div className="w-full md:w-2/3 flex flex-col">
                      <h2 className="text-xl md:text-2xl font-bold leading-tight mb-6 line-clamp-2 text-white/90" dir="auto">
                        {videoInfo.title}
                      </h2>
                      
                      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-blue-400" />
                        {t.downloadOptions}
                      </h3>
                      
                      <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {videoInfo.formats.length > 0 ? videoInfo.formats.map((format, idx) => {
                          const isDownloading = downloadingFormatId === format.format_id;
                          const resLabel = format.resolution === 'صوت فقط' ? t.audioOnly : format.resolution;
                          
                          return (
                            <div key={idx} className={`relative overflow-hidden bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 flex items-center justify-between transition-all group ${isDownloading ? 'ring-2 ring-blue-500/50 bg-blue-500/5' : ''}`}>
                              
                              {/* Progress Bar Background */}
                              {isDownloading && downloadProgress && (
                                <div className="absolute inset-0 bg-blue-500/10 origin-left transition-all duration-300" style={{ width: `${downloadProgress.percentage}%` }} />
                              )}

                              <div className="relative z-10 flex flex-col gap-1.5">
                                <span className="font-bold text-white flex items-center gap-2" dir="ltr">
                                  {!format.vcodec ? <Music className="w-4 h-4 text-purple-400" /> : <FileVideo className="w-4 h-4 text-blue-400" />}
                                  <span className="text-lg">{resLabel}</span>
                                </span>
                                <span className="text-xs text-slate-400 flex items-center gap-2 font-mono">
                                  <span className="uppercase font-semibold text-slate-300">{format.ext}</span>
                                  {format.filesize ? (
                                    <>
                                      <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                      <span>{(format.filesize / (1024 * 1024)).toFixed(1)} MB</span>
                                    </>
                                  ) : null}
                                </span>
                              </div>

                              <div className="relative z-10 flex items-center gap-3">
                                {isDownloading && downloadProgress ? (
                                  <div className="text-right flex flex-col gap-1 mr-3">
                                    <span className="text-blue-400 font-bold text-sm">{downloadProgress.percentage}%</span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {(downloadProgress.loaded / (1024*1024)).toFixed(1)} / {(downloadProgress.total / (1024*1024)).toFixed(1)} MB
                                    </span>
                                  </div>
                                ) : null}
                                
                                <div className="flex items-center gap-2">
                                  {format.vcodec && (
                                     <button
                                       onClick={() => { setPreviewFormatId(format.format_id); setPreviewState('playing'); }}
                                       className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all shadow-lg"
                                       title={t.previewBtn}
                                     >
                                       <Play className="w-4 h-4 text-green-400" />
                                     </button>
                                  )}
                                  <button
                                     onClick={() => {
                                       navigator.clipboard.writeText(`${window.location.origin}/api/download?taskId=${taskId}&formatId=${format.format_id}`);
                                       setCopiedFormatId(format.format_id);
                                       setTimeout(() => setCopiedFormatId(null), 2000);
                                     }}
                                     className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all shadow-lg group/copy relative"
                                     title={t.copyLinkBtn}
                                  >
                                     {copiedFormatId === format.format_id ? (
                                       <Check className="w-4 h-4 text-green-400" />
                                     ) : (
                                       <Copy className="w-4 h-4 text-slate-300 group-active/copy:text-green-400" />
                                     )}
                                     {copiedFormatId === format.format_id && (
                                       <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap">{t.linkCopied}</span>
                                     )}
                                  </button>
                                  <button
                                    onClick={() => handleDownload(format)}
                                    disabled={!!downloadingFormatId}
                                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-slate-500 text-white text-sm font-semibold transition-all flex items-center gap-2 shadow-lg"
                                  >
                                    {isDownloading ? (
                                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                                    ) : (
                                      <Download className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        }) : (
                          <div className="text-center p-8 text-slate-400 bg-white/5 rounded-2xl border border-white/10">
                            {t.noFormats}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            </>
          } />
          
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/cookie-policy" element={<Cookies />} />
          <Route path="/dmca" element={<Dmca />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-6 text-slate-500 text-sm mt-auto border-t border-white/5 bg-slate-950/50 backdrop-blur-md">
        <p>{t.footer}</p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4 max-w-2xl mx-auto">
          <Link to="/about" className="hover:text-blue-400 transition-colors">About Us</Link>
          <Link to="/contact" className="hover:text-blue-400 transition-colors">Contact</Link>
          <Link to="/privacy-policy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</Link>
          <Link to="/cookie-policy" className="hover:text-blue-400 transition-colors">Cookie Policy</Link>
          <Link to="/dmca" className="hover:text-blue-400 transition-colors">DMCA</Link>
          <Link to="/faq" className="hover:text-blue-400 transition-colors">FAQ</Link>
        </div>
      </footer>
    </div>
  );
}

