// frontend/src/components/admin/ShipmentConfirmation.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { Truck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ShipmentConfirmationProps {
  orderId: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const ShipmentConfirmation = ({
  orderId,
  onClose,
  onConfirm,
}: ShipmentConfirmationProps) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleConfirmWithAnimation = async () => {
    setIsConfirmed(true);

    // Po 4 sekundach (czas trwania animacji) pokazujemy loader i wykonujemy akcję
    setTimeout(() => {
      setIsConfirmed(false);
      setIsLoading(true);
      onConfirm()
        .then(() => {
          toast({
            title: "🚚 Hurra!",
            description: "📦 Zamówienie zostało wysłane w świat!",
          });
        })
        .finally(() => {
          setIsLoading(false);
          onClose();
        });
    }, 4000);
  };

  const confirmationContent = isConfirmed ? (
    <motion.div className="relative w-full h-full">
      {/* Animowana paczka */}
      <motion.div
        initial={{ x: -100, y: 150, scale: 1 }}
        animate={{
          x: 650,
          y: [150, 50, 150],
          rotate: [0, -15, 15, -15, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 3.5, // Wydłużamy czas animacji
          ease: "easeInOut",
        }}
        className="absolute text-6xl z-10"
      >
        📦
      </motion.div>

      {/* "Houston, mamy wysyłkę!" - tekst leci z góry */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 100, opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2, times: [0, 0.2, 0.8, 1] }}
        className="absolute w-full text-center text-2xl font-bold"
      >
        Houston, mamy wysyłkę! 👨‍🚀
      </motion.div>

      {/* Chmurki dymu lecące za paczką */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={`smoke-${i}`}
          initial={{ x: -50, y: 150, opacity: 0, scale: 0.5 }}
          animate={{
            x: [-50 + i * 30, 50 + i * 50],
            y: [150, 100 + Math.random() * 100],
            opacity: [0, 1, 0],
            scale: [0.5, 1 + Math.random(), 0.5],
          }}
          transition={{
            duration: 2,
            delay: i * 0.2,
            ease: "easeOut",
          }}
          className="absolute text-4xl"
        >
          💨
        </motion.div>
      ))}

      {/* Konfetti i gwiazdy */}
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={`confetti-${i}`}
          initial={{ x: 300, y: 150, scale: 0 }}
          animate={{
            x: 300 + (Math.random() * 600 - 300),
            y: 150 + (Math.random() * 400 - 200),
            scale: [0, 1, 0],
            rotate: Math.random() * 360,
          }}
          transition={{
            duration: 3,
            delay: Math.random() * 2,
            ease: "easeOut",
          }}
          className="absolute text-2xl"
        >
          {["🌟", "✨", "💫", "⭐️", "🎉", "🎊"][Math.floor(Math.random() * 6)]}
        </motion.div>
      ))}

      {/* Zabawny komunikat na końcu */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-8 left-0 right-0 text-center"
      >
        <p className="text-2xl font-bold mb-2">Mission accomplished! 🎯</p>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Paczka mknie do klienta szybciej niż Sputnik! 🛸
        </p>
      </motion.div>
    </motion.div>
  ) : isLoading ? (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Truck className="w-12 h-12 text-primary" />
      </motion.div>
      <p className="text-lg font-medium">Finalizowanie wysyłki...</p>
    </div>
  ) : (
    <div className="space-y-4">
      <div className="text-center space-y-4">
        <div className="text-4xl">🚚 💨 📦</div>
        <h3 className="text-xl font-bold">Czas wypuścić paczkę w świat! 🌍</h3>
        <p className="text-gray-600 dark:text-gray-300">
          Na pewno zakończyć zamówienie i wysłać do klienta wiadomość o wysyłce
          produktu?
        </p>
      </div>
      <div className="flex gap-3 justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium"
          onClick={handleConfirmWithAnimation}
        >
          ✨ Tak, leć paczuszko!
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-medium"
          onClick={onClose}
        >
          🤔 Nie, jeszcze nie teraz
        </motion.button>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={() => !isConfirmed && !isLoading && onClose()}
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl mx-4 relative overflow-hidden"
        style={{
          width: isConfirmed ? "800px" : "400px",
          height: isConfirmed ? "500px" : "auto",
          padding: "2rem",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {confirmationContent}
      </motion.div>
    </motion.div>
  );
};
