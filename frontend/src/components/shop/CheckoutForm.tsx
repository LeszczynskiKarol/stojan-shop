// frontend/src/components/shop/CheckoutForm.tsx
"use client";
import React, { useEffect, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Order, ShippingAddress } from "@/types/order.types";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store/cartStore";
import { Switch } from "@/components/ui/Switch";
import {
  ArrowRight,
  User,
  MapPin,
  FileText,
  Info,
  MessageSquare,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { IProduct } from "@/types/product.types";
import { useAnalytics } from "@/hooks/useAnalytics";
import { usePostalCodeWithCache } from "@/hooks/usePostalCode";
import { Select } from "@/components/ui/Select";
import { toast } from "sonner";
import { debounce } from "lodash";

// Interfejsy
interface CheckoutFormProps {
  onSubmit: (data: ExtendedShippingAddress) => Promise<{
    success: boolean;
    data: {
      order: Order;
      checkoutUrl?: string;
    };
  }>;
  orderSummary?: React.ReactNode;
  paymentMethod: "prepaid" | "cod";
  totalWeight: number;
  product: IProduct;
  quantity: number;
  price: number;
  shippingCost: number;
  savedFormData?: ExtendedShippingAddress | null;
}

interface ExtendedShippingAddress extends ShippingAddress {
  companyName?: string;
  nip?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  street: string;
  postalCode: string;
  city: string;
  differentShippingAddress?: boolean;
  shippingStreet?: string;
  shippingPostalCode?: string;
  shippingCity?: string;
  differentInvoiceAddress?: boolean;
  invoiceStreet?: string;
  invoicePostalCode?: string;
  invoiceCity?: string;
  notes?: string;
  // Dodajemy pola dla pełnych danych adresowych
  gmina?: string;
  powiat?: string;
  wojewodztwo?: string;
  shippingGmina?: string;
  shippingPowiat?: string;
  shippingWojewodztwo?: string;
}

export const CheckoutForm = ({
  onSubmit,
  orderSummary,
  paymentMethod,
  totalWeight,
  product,
  quantity,
  price,
  shippingCost,
  savedFormData,
}: CheckoutFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { cart } = useCartStore();
  const { trackEvent, getPageLocation } = useAnalytics();
  const [differentShippingAddress, setDifferentShippingAddress] =
    useState(false);
  const [wantsInvoice, setWantsInvoice] = useState(false);
  const [isCompanyOrder, setIsCompanyOrder] = useState<boolean | null>(null);

  // Stan dla kodów pocztowych
  const {
    fetchPostalCodeData,
    fetchCitiesForPostalCode,
    isLoading: isLoadingPostalCode,
  } = usePostalCodeWithCache();
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [shippingAvailableCities, setShippingAvailableCities] = useState<
    string[]
  >([]);
  const [postalCodeVerified, setPostalCodeVerified] = useState(false);
  const [shippingPostalCodeVerified, setShippingPostalCodeVerified] =
    useState(false);
  const [postalCodeData, setPostalCodeData] = useState<any[]>([]);
  const [shippingPostalCodeData, setShippingPostalCodeData] = useState<any[]>(
    []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
    clearErrors,
  } = useForm<ExtendedShippingAddress>({
    mode: "onSubmit",
  });

  const companyName = watch("companyName");
  const nip = watch("nip");
  const firstName = watch("firstName");
  const lastName = watch("lastName");
  const postalCode = watch("postalCode");
  const shippingPostalCode = watch("shippingPostalCode");
  const city = watch("city");

  // Automatyczne przełączanie między firmą a osobą
  useEffect(() => {
    if (companyName && companyName.trim().length > 0) {
      if (isCompanyOrder !== true) {
        setIsCompanyOrder(true);
        setValue("firstName", "");
        setValue("lastName", "");
        clearErrors(["firstName", "lastName"]);
      }
    } else if (
      (firstName && firstName.trim().length > 0) ||
      (lastName && lastName.trim().length > 0)
    ) {
      if (isCompanyOrder !== false) {
        setIsCompanyOrder(false);
        setValue("companyName", "");
        setValue("nip", "");
        setWantsInvoice(false);
        clearErrors(["companyName", "nip"]);
      }
    } else {
      setIsCompanyOrder(null);
    }
  }, [companyName, firstName, lastName, setValue, clearErrors, isCompanyOrder]);

  const formatPostalCode = (value: string): string => {
    const digitsOnly = value.replace(/\D/g, "");
    // Dodaj myślnik tylko gdy są więcej niż 2 cyfry
    if (digitsOnly.length > 2) {
      return `${digitsOnly.slice(0, 2)}-${digitsOnly.slice(2, 5)}`;
    }
    return digitsOnly;
  };

  const formatNIP = (value: string): string => {
    return value.replace(/\D/g, "").slice(0, 10);
  };

  // Debounce dla API kodów pocztowych
  const handlePostalCodeLookup = useCallback(
    debounce(async (postalCode: string, isShipping: boolean = false) => {
      // Sprawdź format kodu
      if (!/^\d{2}-\d{3}$/.test(postalCode)) {
        return;
      }

      const data = await fetchPostalCodeData(postalCode);
      const cities = await fetchCitiesForPostalCode(postalCode);

      console.log("=== DEBUG POSTAL CODE API ===");
      console.log("Kod:", postalCode);
      console.log("Data z API:", data);
      console.log("Cities:", cities);
      console.log("isShipping:", isShipping);

      if (data && data.length > 0) {
        if (isShipping) {
          setShippingPostalCodeData(data);
          setShippingAvailableCities(cities);

          // Jeśli jest tylko jedna miejscowość, ustaw ją automatycznie
          if (data.length === 1) {
            setValue("shippingCity", data[0].miejscowosc);
            setValue("shippingGmina", data[0].gmina);
            setValue("shippingPowiat", data[0].powiat);
            setValue("shippingWojewodztwo", data[0].wojewodztwo);
            setShippingPostalCodeVerified(true);
            toast.success(
              `Znaleziono: ${data[0].miejscowosc}, ${data[0].powiat}`
            );
          } else {
            // Jeśli jest wiele miejscowości, wyczyść pole miasta i pokaż informację
            setValue("shippingCity", "");
            setShippingPostalCodeVerified(false);
            toast.info(
              `Znaleziono ${data.length} miejscowości dla tego kodu. Wybierz z listy.`
            );
          }

          // Jeśli któreś z danych ma ulicę, pokaż sugestię
          const streetsFound = data.filter((d) => d.ulica).map((d) => d.ulica);
          if (streetsFound.length > 0) {
            const uniqueStreets = [...new Set(streetsFound)];
            toast.info(`Sugerowane ulice: ${uniqueStreets.join(", ")}`);
          }
        } else {
          setPostalCodeData(data);
          setAvailableCities(cities);

          // Jeśli jest tylko jedna miejscowość, ustaw ją automatycznie
          if (data.length === 1) {
            setValue("city", data[0].miejscowosc);
            setValue("gmina", data[0].gmina);
            setValue("powiat", data[0].powiat);
            setValue("wojewodztwo", data[0].wojewodztwo);
            setPostalCodeVerified(true);
            toast.success(
              `Znaleziono: ${data[0].miejscowosc}, ${data[0].powiat}`
            );
          } else {
            // Jeśli jest wiele miejscowości, wyczyść pole miasta i pokaż informację
            setValue("city", "");
            setPostalCodeVerified(false);
            toast.info(
              `Znaleziono ${data.length} miejscowości dla tego kodu. Wybierz z listy.`
            );
          }

          // Sugestie ulic
          const streetsFound = data.filter((d) => d.ulica).map((d) => d.ulica);
          if (streetsFound.length > 0) {
            const uniqueStreets = [...new Set(streetsFound)];
            toast.info(`Sugerowane ulice: ${uniqueStreets.join(", ")}`);
          }
        }

        // Wyczyść błędy dla pola miasta
        clearErrors(isShipping ? "shippingCity" : "city");
      } else {
        // Reset weryfikacji jeśli nie znaleziono
        if (isShipping) {
          setShippingPostalCodeVerified(false);
          setShippingAvailableCities([]);
          setShippingPostalCodeData([]);
        } else {
          setPostalCodeVerified(false);
          setAvailableCities([]);
          setPostalCodeData([]);
        }
      }
    }, 500),
    [fetchPostalCodeData, fetchCitiesForPostalCode, setValue, clearErrors]
  );

  // Obsługa zmiany kodu pocztowego
  useEffect(() => {
    if (postalCode && postalCode.length === 6) {
      handlePostalCodeLookup(postalCode, false);
    } else {
      setPostalCodeVerified(false);
    }
  }, [postalCode]);

  useEffect(() => {
    if (
      differentShippingAddress &&
      shippingPostalCode &&
      shippingPostalCode.length === 6
    ) {
      handlePostalCodeLookup(shippingPostalCode, true);
    } else {
      setShippingPostalCodeVerified(false);
    }
  }, [shippingPostalCode, differentShippingAddress]);

  // Gdy wyłączamy fakturę, czyścimy NIP
  useEffect(() => {
    if (!wantsInvoice) {
      setValue("nip", "");
      clearErrors("nip");
    }
  }, [wantsInvoice, setValue, clearErrors]);

  useEffect(() => {
    if (savedFormData) {
      Object.keys(savedFormData).forEach((key) => {
        const value = savedFormData[key as keyof ExtendedShippingAddress];
        if (
          value !== undefined &&
          value !== null &&
          key !== "timestamp" &&
          key !== "paymentMethod"
        ) {
          setValue(key as keyof ExtendedShippingAddress, value);
        }
      });

      if (savedFormData.differentShippingAddress) {
        setDifferentShippingAddress(true);
      }
      if (savedFormData.nip) {
        setWantsInvoice(true);
      }

      if (savedFormData.companyName) {
        setIsCompanyOrder(true);
      } else if (savedFormData.firstName || savedFormData.lastName) {
        setIsCompanyOrder(false);
      }
    }
  }, [savedFormData, setValue]);

  const handleFormSubmit = async (data: ExtendedShippingAddress) => {
    const hasCompany = data.companyName && data.companyName.trim() !== "";
    const hasPerson =
      data.firstName &&
      data.firstName.trim() !== "" &&
      data.lastName &&
      data.lastName.trim() !== "";

    if (!hasCompany && !hasPerson) {
      await trigger(["companyName", "firstName", "lastName"]);
      return;
    }

    if (data.nip && data.nip.length > 0) {
      if (!data.companyName || data.companyName.trim() === "") {
        await trigger("companyName");
        return;
      }
      if (data.nip.length !== 10) {
        await trigger("nip");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const processedData = {
        ...data,
        firstName: data.firstName || (hasCompany ? data.companyName : ""),
        lastName: data.lastName || (hasCompany ? "-" : ""),

        shippingStreet: data.differentShippingAddress
          ? data.shippingStreet
          : data.street,
        shippingPostalCode: data.differentShippingAddress
          ? data.shippingPostalCode
          : data.postalCode,
        shippingCity: data.differentShippingAddress
          ? data.shippingCity
          : data.city,

        invoiceStreet: data.street,
        invoicePostalCode: data.postalCode,
        invoiceCity: data.city,
      };

      await onSubmit(processedData);
    } catch (error) {
      console.error("Błąd:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-8">
      {orderSummary && (
        <div className="rounded-lg border border-border bg-card p-6">
          {orderSummary}
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* SEKCJA 1: Dane kontaktowe */}
        <div className="bg-accent p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <User className="w-5 h-5" />
            Dane kontaktowe
          </h3>

          <div className="space-y-5">
            {/* Nazwa firmy - pokazuje się tylko gdy nie ma osoby */}
            {isCompanyOrder !== false && (
              <>
                <div className="space-y-1">
                  <Input
                    {...register("companyName", {
                      validate: (value) => {
                        if (
                          nip &&
                          nip.length > 0 &&
                          (!value || value.trim() === "")
                        ) {
                          return "Nazwa firmy jest wymagana przy podanym NIP";
                        }
                        if (
                          isCompanyOrder === null &&
                          (!firstName || firstName.trim() === "") &&
                          (!lastName || lastName.trim() === "") &&
                          (!value || value.trim() === "")
                        ) {
                          return "Podaj nazwę firmy lub imię i nazwisko";
                        }
                        return true;
                      },
                    })}
                    placeholder="Nazwa firmy"
                    error={errors.companyName?.message}
                    className="bg-background border-border w-full"
                  />
                  <p className="text-xs text-muted-foreground pl-1">
                    Wypełnij, jeśli zamawiasz na firmę
                  </p>
                </div>
              </>
            )}

            {/* Wizualny separator LUB */}
            {isCompanyOrder === null && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/30"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-accent px-3 text-xs text-muted-foreground uppercase tracking-wider">
                    lub
                  </span>
                </div>
              </div>
            )}

            {/* Imię i nazwisko */}
            {isCompanyOrder !== true && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  {...register("firstName", {
                    validate: (value) => {
                      if (
                        isCompanyOrder === false &&
                        (!value || value.trim() === "")
                      ) {
                        return "Imię jest wymagane";
                      }
                      if (
                        isCompanyOrder === null &&
                        (!companyName || companyName.trim() === "") &&
                        (!value || value.trim() === "")
                      ) {
                        return "Imię jest wymagane (lub podaj nazwę firmy)";
                      }
                      return true;
                    },
                  })}
                  placeholder="Imię"
                  error={errors.firstName?.message}
                  className="bg-background border-border"
                />
                <Input
                  {...register("lastName", {
                    validate: (value) => {
                      if (
                        isCompanyOrder === false &&
                        (!value || value.trim() === "")
                      ) {
                        return "Nazwisko jest wymagane";
                      }
                      if (
                        isCompanyOrder === null &&
                        (!companyName || companyName.trim() === "") &&
                        (!value || value.trim() === "")
                      ) {
                        return "Nazwisko jest wymagane (lub podaj nazwę firmy)";
                      }
                      return true;
                    },
                  })}
                  placeholder="Nazwisko"
                  error={errors.lastName?.message}
                  className="bg-background border-border"
                />
              </div>
            )}

            {/* Email i telefon */}
            <div className="space-y-4 border-t border-border/30 pt-4">
              <Input
                {...register("email", {
                  required: "Email jest wymagany",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Nieprawidłowy adres email",
                  },
                })}
                type="email"
                placeholder="Adres email *"
                error={errors.email?.message}
                className="bg-background border-border"
              />

              <Input
                {...register("phone", {
                  required: "Telefon jest wymagany",
                  pattern: {
                    value: /^[0-9+\s()-]+$/,
                    message: "Nieprawidłowy numer telefonu",
                  },
                  minLength: {
                    value: 9,
                    message: "Numer telefonu za krótki",
                  },
                })}
                placeholder="Numer telefonu *"
                error={errors.phone?.message}
                className="bg-background border-border"
              />
            </div>

            {/* Opcja faktury VAT */}
            <div className="border-t border-border/30 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={wantsInvoice}
                    onCheckedChange={setWantsInvoice}
                    className="data-[state=checked]:bg-primary"
                  />
                  <div>
                    <label className="text-foreground font-medium cursor-pointer">
                      Faktura VAT
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Wystawimy fakturę VAT
                    </p>
                  </div>
                </div>
              </div>

              {wantsInvoice && (
                <div className="mt-4">
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                    <div className="flex items-start gap-2 mb-3">
                      <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Faktura VAT zostanie wystawiona na podane poniżej dane.
                        {isCompanyOrder !== true &&
                          " Pole NIP jest opcjonalne dla osób prywatnych."}
                      </p>
                    </div>

                    <Input
                      {...register("nip", {
                        validate: (value) => {
                          if (
                            isCompanyOrder === true &&
                            wantsInvoice &&
                            (!value || value.length === 0)
                          ) {
                            return "NIP jest wymagany dla faktury VAT na firmę";
                          }
                          if (
                            value &&
                            value.length > 0 &&
                            value.length !== 10
                          ) {
                            return "NIP musi składać się z 10 cyfr";
                          }
                          return true;
                        },
                        onChange: (e) => {
                          const formattedValue = formatNIP(e.target.value);
                          e.target.value = formattedValue;
                          setValue("nip", formattedValue);
                        },
                      })}
                      placeholder={
                        isCompanyOrder === true
                          ? "NIP (10 cyfr) *"
                          : "NIP (opcjonalnie)"
                      }
                      maxLength={10}
                      error={errors.nip?.message}
                      className="bg-background border-border"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SEKCJA 2: Adres (ZMIENIONA KOLEJNOŚĆ) */}
        <div className="bg-accent p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Adres {isCompanyOrder === true ? "firmy" : ""}
          </h3>

          <div className="space-y-4">
            {/* KOD POCZTOWY NAJPIERW */}
            <div className="relative">
              <Input
                {...register("postalCode", {
                  required: "Kod pocztowy jest wymagany",
                  pattern: {
                    value: /^\d{2}-\d{3}$/,
                    message: "Format: 00-000",
                  },
                  onChange: (e) => {
                    const formattedValue = formatPostalCode(e.target.value);
                    e.target.value = formattedValue;
                    setValue("postalCode", formattedValue);
                  },
                })}
                placeholder="Kod pocztowy * (np. 01-111)"
                maxLength={6}
                error={errors.postalCode?.message}
                className="bg-background border-border pr-10"
              />
              {isLoadingPostalCode && postalCode?.length === 6 && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
              {postalCodeVerified && (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
              )}
            </div>

            {/* MIASTO - automatycznie wypełniane lub wybór z listy */}
            <div className="space-y-1">
              {postalCodeData.length > 1 ? (
                // Jeśli jest wiele miejscowości, pokaż select
                <div className="space-y-2">
                  <select
                    {...register("city", { required: "Wybierz miejscowość" })}
                    className="w-full p-3 bg-background border border-border rounded-md 
               focus:outline-none focus:ring-2 focus:ring-primary/20"
                    onChange={(e) => {
                      const selectedCity = e.target.value;

                      // Jeśli wybrano "Wpisz ręcznie", przełącz na pole input
                      if (selectedCity === "__manual_input__") {
                        setPostalCodeData([]); // Wyczyść dane, żeby pokazać zwykłe pole input
                        setValue("city", "");
                        return;
                      }
                    }}
                  >
                    <option value="">-- Wybierz miejscowość --</option>
                    <option value="__manual_input__">➤ Wpisz ręcznie</option>
                    <option disabled>──────────────</option>
                    {postalCodeData.map((data, idx) => {
                      let label = data.miejscowosc;
                      // Dodaj rozróżnienie jeśli jest wiele miejscowości
                      if (postalCodeData.length > 1) {
                        if (data.gmina && data.gmina.startsWith("M.")) {
                          label = `${data.miejscowosc} (miasto)`;
                        } else if (
                          data.gmina &&
                          data.gmina !== data.miejscowosc
                        ) {
                          label = `${data.miejscowosc} (gm. ${data.gmina})`;
                        }
                      }
                      return (
                        <option key={idx} value={data.miejscowosc}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                  {errors.city && (
                    <p className="text-xs text-red-500">
                      {errors.city.message}
                    </p>
                  )}
                  <p className="text-xs text-amber-600 dark:text-amber-400 pl-1">
                    ⚠ Dla tego kodu pocztowego istnieje {postalCodeData.length}{" "}
                    miejscowości. Wybierz właściwą.
                  </p>
                </div>
              ) : (
                // Jeśli jest jedna miejscowość lub nie ma danych, pokaż zwykłe pole
                <Input
                  {...register("city", {
                    required: "Miejscowość jest wymagana",
                  })}
                  placeholder="Miejscowość *"
                  error={errors.city?.message}
                  className={`bg-background border-border ${
                    postalCodeVerified ? "bg-green-50 dark:bg-green-900/10" : ""
                  }`}
                  onChange={(e) => {
                    // Gdy użytkownik edytuje pole, usuń weryfikację
                    if (postalCodeVerified) {
                      setPostalCodeVerified(false);
                    }
                  }}
                />
              )}

              {postalCodeVerified && availableCities.length <= 1 && (
                <p className="text-xs text-green-600 dark:text-green-400 pl-1">
                  ✓ Miejscowość uzupełniona automatycznie
                </p>
              )}
            </div>

            {/* ULICA I NUMER */}
            <Input
              {...register("street", {
                required: "Adres jest wymagany",
                pattern: {
                  value: /.*\d+.*/,
                  message: "Adres musi zawierać numer budynku",
                },
              })}
              placeholder="Ulica i/lub numer *"
              error={errors.street?.message}
              className="bg-background border-border"
            />
          </div>
        </div>

        {/* SEKCJA 3: Adres dostawy */}
        <div className="bg-accent p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Adres dostawy
            </h3>

            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground">
                Inny niż podany wyżej
              </label>
              <Switch
                checked={differentShippingAddress}
                onCheckedChange={setDifferentShippingAddress}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>

          {!differentShippingAddress ? (
            <p className="text-sm text-muted-foreground">
              ✓ Dostawa na adres podany wyżej
            </p>
          ) : (
            <div className="space-y-4">
              {/* KOD POCZTOWY DOSTAWY */}
              <div className="relative">
                <Input
                  {...register("shippingPostalCode", {
                    required: differentShippingAddress
                      ? "Kod pocztowy jest wymagany"
                      : false,
                    pattern: differentShippingAddress
                      ? {
                          value: /^\d{2}-\d{3}$/,
                          message: "Format: 00-000",
                        }
                      : undefined,
                    onChange: (e) => {
                      const formattedValue = formatPostalCode(e.target.value);
                      e.target.value = formattedValue;
                      setValue("shippingPostalCode", formattedValue);
                    },
                  })}
                  placeholder="Kod pocztowy * (np. 01-111)"
                  maxLength={6}
                  error={errors.shippingPostalCode?.message}
                  className="bg-background border-border pr-10"
                />
                {isLoadingPostalCode && shippingPostalCode?.length === 6 && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                )}
                {shippingPostalCodeVerified && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                )}
              </div>

              {/* MIASTO DOSTAWY */}
              <div className="space-y-1">
                {shippingPostalCodeData.length > 1 ? (
                  // Jeśli jest wiele miejscowości, pokaż select
                  <div className="space-y-2">
                    <select
                      {...register("shippingCity", {
                        required: differentShippingAddress
                          ? "Wybierz miejscowość"
                          : false,
                      })}
                      className="w-full p-3 bg-background border border-border rounded-md 
                               focus:outline-none focus:ring-2 focus:ring-primary/20"
                      onChange={(e) => {
                        const selectedCity = e.target.value;
                        // Znajdź pełne dane dla wybranej miejscowości
                        const cityData = shippingPostalCodeData.find((d) => {
                          // Sprawdź czy to miasto (kończy się na "(miasto)")
                          if (selectedCity.endsWith("(miasto)")) {
                            return (
                              d.miejscowosc ===
                                selectedCity.replace(" (miasto)", "") &&
                              d.gmina &&
                              d.gmina.startsWith("M.")
                            );
                          }
                          // Sprawdź czy ma gminę w nawiasach
                          else if (selectedCity.includes("(gm.")) {
                            const cityName = selectedCity.split(" (gm.")[0];
                            const gminaName =
                              selectedCity.match(/\(gm\. ([^)]+)\)/)?.[1];
                            return (
                              d.miejscowosc === cityName &&
                              d.gmina === gminaName
                            );
                          }
                          // Sprawdź czy ma powiat w nawiasach
                          else if (selectedCity.includes("(pow.")) {
                            const cityName = selectedCity.split(" (pow.")[0];
                            return d.miejscowosc === cityName;
                          }
                          return d.miejscowosc === selectedCity;
                        });

                        if (cityData) {
                          setValue("shippingCity", cityData.miejscowosc);
                          setValue("shippingGmina", cityData.gmina);
                          setValue("shippingPowiat", cityData.powiat);
                          setValue("shippingWojewodztwo", cityData.wojewodztwo);
                          setShippingPostalCodeVerified(true);
                        }
                      }}
                    >
                      <option value="">-- Wybierz miejscowość --</option>
                      {shippingPostalCodeData.map((data, idx) => {
                        let label = data.miejscowosc;
                        if (shippingPostalCodeData.length > 1) {
                          if (data.gmina && data.gmina.startsWith("M.")) {
                            label = `${data.miejscowosc} (miasto)`;
                          } else if (
                            data.gmina &&
                            data.gmina !== data.miejscowosc
                          ) {
                            label = `${data.miejscowosc} (gm. ${data.gmina})`;
                          }
                        }
                        return (
                          <option key={idx} value={data.miejscowosc}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                    <p className="text-xs text-amber-600 dark:text-amber-400 pl-1">
                      ⚠ Dla tego kodu pocztowego istnieje{" "}
                      {shippingPostalCodeData.length} miejscowości. Wybierz
                      właściwą.
                    </p>
                  </div>
                ) : (
                  // Jeśli jest jedna miejscowość lub nie ma danych, pokaż zwykłe pole
                  <Input
                    {...register("shippingCity", {
                      required: differentShippingAddress
                        ? "Miejscowość jest wymagana"
                        : false,
                    })}
                    placeholder="Miejscowość *"
                    error={errors.shippingCity?.message}
                    className={`bg-background border-border ${
                      shippingPostalCodeVerified
                        ? "bg-green-50 dark:bg-green-900/10"
                        : ""
                    }`}
                    onChange={(e) => {
                      // Jeśli użytkownik edytuje miasto, resetuj weryfikację
                      if (shippingPostalCodeVerified) {
                        setShippingPostalCodeVerified(false);
                      }
                    }}
                  />
                )}

                {shippingPostalCodeVerified &&
                  shippingPostalCodeData.length <= 1 && (
                    <p className="text-xs text-green-600 dark:text-green-400 pl-1">
                      ✓ Miejscowość uzupełniona automatycznie
                    </p>
                  )}
                {errors.shippingCity && (
                  <p className="text-xs text-red-500 pl-1">
                    {errors.shippingCity.message}
                  </p>
                )}
              </div>

              {/* ULICA DOSTAWY */}
              <Input
                {...register("shippingStreet", {
                  required: differentShippingAddress
                    ? "Adres dostawy jest wymagany"
                    : false,
                  pattern: differentShippingAddress
                    ? {
                        value: /.*\d+.*/,
                        message: "Adres musi zawierać numer budynku",
                      }
                    : undefined,
                })}
                placeholder="Ulica i/lub numer *"
                error={errors.shippingStreet?.message}
                className="bg-background border-border"
              />
            </div>
          )}
        </div>

        {/* SEKCJA 4: Uwagi do zamówienia */}
        <div className="bg-accent p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Uwagi do zamówienia
          </h3>

          <textarea
            {...register("notes", {
              maxLength: {
                value: 500,
                message: "Maksymalnie 500 znaków",
              },
            })}
            placeholder="Dodatkowe informacje, prośby lub uwagi dotyczące zamówienia (opcjonalne)"
            className="w-full min-h-[100px] p-3 bg-background border border-border rounded-md 
                     focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
            rows={4}
          />
          {errors.notes && (
            <p className="text-xs text-red-500 mt-1">{errors.notes.message}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {watch("notes")?.length || 0}/500 znaków
          </p>
        </div>

        {/* Podsumowanie */}
        <div className="text-xs text-muted-foreground px-2">
          * Pola oznaczone gwiazdką są wymagane
        </div>

        {/* Przycisk */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#f3bc00] hover:bg-[#f3bc00]/90 text-white py-6 text-base font-medium"
        >
          <AnimatePresence mode="wait">
            {isSubmitting ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Przetwarzanie zamówienia...</span>
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <ArrowRight className="w-5 h-5" />
                <span>Złóż zamówienie</span>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </form>
    </div>
  );
};
