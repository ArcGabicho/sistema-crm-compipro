export default function Whatsapp() {
  return (
    <a
      href="https://wa.me/973644878"
      className="fixed bottom-5 right-5 w-20 h-20 rounded-full flex justify-center items-center no-underline shadow-lg transition-transform duration-300 ease-in-out hover:scale-110 z-50"
      target="_blank"
      rel="noopener noreferrer"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/web/Whatsapp-logo.webp"
        alt="WhatsApp"
        className="w-full h-full rounded-full"
      />
    </a>
  );
}
