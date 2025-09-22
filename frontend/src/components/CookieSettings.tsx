// frontend/src/components/CookieSettings.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useConsent } from "@/context/ConsentContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Switch } from "@/components/ui/Switch";

interface CookieSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CookieSettings({
  isOpen,
  onClose,
}: CookieSettingsProps) {
  const { consentSettings, updateConsent } = useConsent();
  const [tempSettings, setTempSettings] = useState(consentSettings);

  useEffect(() => {
    setTempSettings(consentSettings);
  }, [consentSettings]);

  const handleSave = () => {
    updateConsent(tempSettings);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ustawienia prywatności</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Niezbędne</h3>
              <p className="text-sm text-gray-500">
                Wymagane do działania strony
              </p>
            </div>
            <Switch checked disabled />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Analityczne</h3>
              <p className="text-sm text-gray-500">
                Pomaga nam zrozumieć jak używasz strony
              </p>
            </div>
            <Switch
              checked={tempSettings.analytics_storage === "granted"}
              onCheckedChange={(checked) =>
                setTempSettings((prev) => ({
                  ...prev,
                  analytics_storage: checked ? "granted" : "denied",
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Reklamowe</h3>
              <p className="text-sm text-gray-500">
                Pozwala na wyświetlanie spersonalizowanych reklam
              </p>
            </div>
            <Switch
              checked={tempSettings.ad_storage === "granted"}
              onCheckedChange={(checked) =>
                setTempSettings((prev) => ({
                  ...prev,
                  ad_storage: checked ? "granted" : "denied",
                  ad_user_data: checked ? "granted" : "denied",
                  ad_personalization: checked ? "granted" : "denied",
                }))
              }
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Anuluj
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Zapisz
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
