import {
  Field as FieldRoot,
  FieldLabel,
  FieldError,
  FieldLegend,
  FieldSet,
  FieldGroup,
} from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyDescription } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PropTypes from "prop-types";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Wallet,
  Plus,
  Check,
  ChevronRight,
  CreditCard,
  MapPin,
  PackageCheck,
  QrCode,
  ShoppingBag,
} from "lucide-react";
import { useRef, useState } from "react";
import { AddressBookDialog } from "@/components/form/address-book-dialog";
import { useAddressBook, formatAddress } from "@/hooks/use-address-book";
import { CheckoutOrderPanel } from "@/components/product/checkout-order-panel";
import { useVouchers } from "@/services/vouchers";
import { checkoutApi, usePaymentMethods } from "@/services/checkout";
import { OrderSummary } from "@/components/product/order-summary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/cart-context";
import { useUser } from "@/hooks/use-user";
import {
  deliveryOptions,
  paymentLabels,
  validateWizardStep,
} from "@/lib/checkout/wizard";
import { formatCurrency } from "@/lib/utils/overview-data";
const steps = [
  {
    label: "Giỏ hàng",
    detail: "Kiểm tra sản phẩm",
    icon: ShoppingBag,
  },
  {
    label: "Nhận hàng",
    detail: "Người nhận & địa chỉ",
    icon: MapPin,
  },
  {
    label: "Thanh toán",
    detail: "Chọn phương thức",
    icon: CreditCard,
  },
  {
    label: "Xác nhận",
    detail: "Kiểm tra lần cuối",
    icon: PackageCheck,
  },
];
const paymentIcons = {
  cod: Banknote,
  momo: Wallet,
  zalopay: Wallet,
  vnpay: QrCode,
  paypal: Wallet,
  stripe: CreditCard,
};
function Field({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
  readOnly = false,
}) {
  return (
    <FieldRoot data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={`purchase-${name}`}>{label}</FieldLabel>
      <Input
        id={`purchase-${name}`}
        name={name}
        type={type}
        autoComplete={autoComplete}
        readOnly={readOnly}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `error-${name}` : undefined}
      />
      <ErrorMessage name={name} error={error} />
    </FieldRoot>
  );
}
function ErrorMessage({ name, error }) {
  return error ? <FieldError id={`error-${name}`}>{error}</FieldError> : null;
}
export default function PurchasePage() {
  const { selectedItems, selectedTotal, updateQuantity, removeItem } =
    useCart();
  const { user } = useUser();
  const [paymentError, setPaymentError] = useState("");
  const [step, setStep] = useState(0);
  const addressBook = useAddressBook();
  const [addingAddress, setAddingAddress] = useState(false);
  const [recipient, setRecipient] = useState({});
  const [method, setMethod] = useState("cod");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { orderId } = useSearch({
    strict: false,
  });
  const methods = usePaymentMethods();
  const vouchers = useVouchers();
  const [quote, setQuote] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const submissionLock = useRef(false);
  const requestKey = useRef(null);
  const headingRef = useRef(null);
  // Profile values remain available if the session finishes loading after mount.
  const values = {
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    email: user?.email ?? "",
    delivery: "delivery",
    addressId:
      addressBook.addresses.find((address) => address.isDefault)?.id ??
      addressBook.addresses[0]?.id ??
      "",
    store: "hcm",
    shipping: "standard",
    note: "",
    voucherCode: "",
    ...recipient,
  };
  const selectedAddress = addressBook.addresses.find(
    (address) => address.id === values.addressId,
  );
  if (values.delivery === "delivery") {
    values.name = selectedAddress?.recipientName ?? "";
    values.phone = selectedAddress?.phone ?? "";
  }
  const shipping =
    values.delivery === "store" ? 0 : deliveryOptions[values.shipping].price;
  const destination = selectedAddress
    ? formatAddress(selectedAddress)
    : "Chưa chọn địa chỉ";
  function change(name, value) {
    setRecipient((current) => ({
      ...current,
      [name]: value,
    }));
    setErrors((current) => ({
      ...current,
      [name]: undefined,
    }));
    setQuote(null);
    requestKey.current = null;
  }
  function goTo(next) {
    setStep(next);
    setErrors({});
    setQuote(null);
    requestKey.current = null;
    requestAnimationFrame(() => headingRef.current?.focus());
  }
  async function next(event) {
    event.preventDefault();
    if (submissionLock.current) return;
    const nextErrors = validateWizardStep(
      step,
      selectedItems,
      values,
      method,
      addressBook.addresses,
    );
    if (!user) nextErrors.cart = "Vui lòng đăng nhập để đặt hàng.";
    if (
      step >= 2 &&
      !methods.data?.some(
        (item) => item.id === method && item.enabled && !item.hidden,
      )
    )
      nextErrors.payment = "Phương thức thanh toán hiện không khả dụng.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const checkout = {
      items: selectedItems.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      })),
      addressId: values.addressId,
      shipping: values.shipping,
      provider: method,
      note: values.note,
      voucherCode: values.voucherCode,
    };
    if (step < 2) {
      goTo(step + 1);
      return;
    }
    submissionLock.current = true;
    setSubmitting(true);
    try {
      if (step === 2) {
        const result = await checkoutApi.quote(checkout);
        goTo(3);
        setQuote(result);
      } else {
        if (!quote) throw new Error("Vui lòng kiểm tra lại giá đơn hàng.");
        requestKey.current ??= globalThis.crypto.randomUUID();
        const order = await checkoutApi.place({
          requestKey: requestKey.current,
          quoteToken: quote.quoteToken,
          checkout,
        });
        if (checkout.provider !== "cod") {
          try {
            const paymentOrder = await checkoutApi.pay(order.id);
            if (!paymentOrder.payment?.url)
              throw new Error(
                "Chưa lấy được liên kết thanh toán. Vui lòng thử lại trên đơn hàng.",
              );
            const url = new URL(paymentOrder.payment.url);
            if (url.protocol !== "https:")
              throw new Error("URL thanh toán không hợp lệ.");
            window.location.assign(url.href);
            return;
          } catch (cause) {
            // Keep the created order available for retry; never place another order.
            setPaymentError(cause.message);
          }
        }
        await navigate({
          to: "/purchase",
          search: {
            orderId: order.id,
          },
          replace: true,
        });
      }
    } catch (cause) {
      setErrors({
        cart: cause.message,
      });
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  }
  if (orderId)
    return <CheckoutOrderPanel orderId={orderId} initialError={paymentError} />;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button
          nativeButton={false}
          render={<Link to="/cart" />}
          size="icon"
          variant="outline"
          aria-label="Quay lại giỏ hàng"
        >
          <ArrowLeft data-icon="inline-start" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Hoàn tất mua hàng</h1>
          <p className="text-sm text-muted-foreground">
            Chỉ vài bước để kiểm tra thông tin mua hàng của bạn.
          </p>
        </div>
      </div>
      <Card className="gap-0 overflow-hidden py-0">
        <nav
          aria-label="Các bước mua hàng"
          className="border-b bg-muted/20 p-4 sm:p-6"
        >
          <ol className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {steps.map((item, index) => (
              <li className="flex items-center gap-3" key={item.label}>
                <Button
                  type="button"
                  disabled={index > step || submitting}
                  onClick={() => goTo(index)}
                  aria-current={step === index ? "step" : undefined}
                  className="group flex min-w-0 items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45"
                  variant="ghost"
                >
                  <span
                    className={cn(
                      "grid size-11 shrink-0 place-items-center rounded-lg transition-colors ",
                      step === index
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : index < step
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {index < step ? (
                      <Check data-icon="inline-start" />
                    ) : (
                      <item.icon className="size-5" />
                    )}
                  </span>
                  <span>
                    <strong
                      className={cn(
                        "block text-sm ",
                        step === index ? "text-primary" : "",
                      )}
                    >
                      {item.label}
                    </strong>
                    <span className="text-xs text-muted-foreground">
                      {item.detail}
                    </span>
                  </span>
                </Button>
                {index < 3 && (
                  <ChevronRight
                    aria-hidden="true"
                    className="ml-auto hidden size-4 shrink-0 text-muted-foreground lg:block"
                  />
                )}
              </li>
            ))}
          </ol>
        </nav>
        <CardContent className="p-4 sm:p-6">
          <form id="purchase-wizard" noValidate onSubmit={next}>
            <FieldGroup className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <section
                className="flex flex-col min-w-0 gap-6"
                aria-labelledby="purchase-step-title"
              >
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Bước {step + 1} / 4
                  </p>
                  <h2
                    id="purchase-step-title"
                    ref={headingRef}
                    tabIndex={-1}
                    className="text-xl font-semibold outline-none"
                  >
                    {steps[step].label}
                  </h2>
                </div>
                <ErrorMessage name="cart" error={errors.cart} />
                {step === 0 && (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">
                        {selectedItems.length} sản phẩm được chọn
                      </p>
                      <Button
                        type="button"
                        nativeButton={false}
                        render={<Link to="/cart" />}
                        variant="ghost"
                        size="sm"
                      >
                        Chỉnh sửa giỏ hàng
                      </Button>
                    </div>
                    {selectedItems.length ? (
                      <div className="divide-y rounded-xl border">
                        {selectedItems.map((item) => (
                          <div key={item.id} className="flex gap-4 p-4">
                            <img
                              alt={item.name}
                              src={item.image}
                              className="size-20 shrink-0 rounded-lg bg-muted object-contain sm:size-24"
                            />
                            <div className="flex min-w-0 flex-1 flex-col gap-2">
                              <strong className="text-sm sm:text-base">
                                {item.name}
                              </strong>
                              <span className="text-xs text-muted-foreground">
                                {item.variantName}
                              </span>
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center rounded-md border">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    aria-label={`Giảm số lượng ${item.name}`}
                                    disabled={item.quantity <= 1}
                                    onClick={() =>
                                      updateQuantity(item.id, item.quantity - 1)
                                    }
                                  >
                                    −
                                  </Button>
                                  <span
                                    className="min-w-7 text-center text-sm"
                                    aria-live="polite"
                                  >
                                    {item.quantity}
                                  </span>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    aria-label={`Tăng số lượng ${item.name}`}
                                    onClick={() =>
                                      updateQuantity(item.id, item.quantity + 1)
                                    }
                                  >
                                    +
                                  </Button>
                                </div>
                                <strong className="text-sm text-primary">
                                  {formatCurrency(item.price * item.quantity)}
                                </strong>
                              </div>
                              <Button
                                type="button"
                                className="w-fit text-xs text-muted-foreground underline underline-offset-4 hover:text-destructive"
                                onClick={() => removeItem(item.id)}
                                variant="ghost"
                              >
                                Xóa khỏi giỏ hàng
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid justify-items-center gap-3 rounded-xl border border-dashed py-12 text-center">
                        <ShoppingBag className="size-10 text-muted-foreground" />
                        <Empty>
                          <EmptyHeader>
                            <EmptyDescription>
                              Chưa có sản phẩm được chọn.
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                        <Button
                          type="button"
                          nativeButton={false}
                          render={<Link to="/cart" />}
                        >
                          Về giỏ hàng
                        </Button>
                      </div>
                    )}
                  </>
                )}
                {step === 1 && (
                  <>
                    <Field
                      label="Email tài khoản"
                      readOnly
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={values.email}
                      onChange={change}
                      error={errors.email}
                    />
                    {values.delivery === "delivery" ? (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="font-medium">Chọn từ sổ địa chỉ</h3>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={!user}
                            onClick={() => setAddingAddress(true)}
                          >
                            <Plus data-icon="inline-start" />
                            Thêm địa chỉ
                          </Button>
                        </div>
                        {!user && (
                          <p className="text-sm text-muted-foreground">
                            Vui lòng{" "}
                            <Link to="/auth/sign-in" className="underline">
                              đăng nhập
                            </Link>{" "}
                            để chọn và lưu địa chỉ.
                          </p>
                        )}
                        {user && addressBook.isPending && (
                          <div role="status">
                            <Skeleton className="h-4 w-32" aria-hidden="true" />
                            Đang tải sổ địa chỉ…
                          </div>
                        )}
                        {user && addressBook.isError && (
                          <Alert variant="destructive">
                            <AlertDescription>
                              <p>Không thể tải sổ địa chỉ.</p>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => addressBook.refetch()}
                              >
                                Thử lại
                              </Button>
                            </AlertDescription>
                          </Alert>
                        )}
                        {user &&
                          !addressBook.isPending &&
                          !addressBook.isError &&
                          !addressBook.addresses.length && (
                            <Empty>
                              <EmptyHeader>
                                <EmptyDescription>
                                  Chưa có địa chỉ. Bấm “Thêm địa chỉ” để lưu địa
                                  chỉ nhận hàng.
                                </EmptyDescription>
                              </EmptyHeader>
                            </Empty>
                          )}
                        <RadioGroup
                          value={values.addressId}
                          onValueChange={(value) => change("addressId", value)}
                          aria-label="Địa chỉ nhận hàng"
                          aria-invalid={Boolean(errors.addressId)}
                        >
                          {addressBook.addresses.map((address) => (
                            <FieldLabel
                              key={address.id}
                              className={cn(
                                "flex cursor-pointer items-start gap-3 rounded-xl border p-4 ",
                                values.addressId === address.id
                                  ? "border-primary bg-primary/5"
                                  : "",
                              )}
                            >
                              <RadioGroupItem value={address.id} />
                              <span className="flex flex-col gap-1">
                                <span className="block">
                                  {address.recipientName} · {address.phone}{" "}
                                  {address.isDefault && (
                                    <Badge variant="secondary">Mặc định</Badge>
                                  )}
                                </span>
                                <span className="block text-sm font-normal text-muted-foreground">
                                  {formatAddress(address)}
                                </span>
                              </span>
                            </FieldLabel>
                          ))}
                        </RadioGroup>
                        <ErrorMessage
                          name="addressId"
                          error={errors.addressId}
                        />
                      </div>
                    ) : null}
                    {values.delivery === "delivery" && (
                      <FieldSet>
                        <FieldLegend className="mb-3 font-medium">
                          Tốc độ giao hàng
                        </FieldLegend>
                        <RadioGroup
                          value={values.shipping}
                          onValueChange={(value) => change("shipping", value)}
                          className="grid gap-3 sm:grid-cols-2"
                        >
                          {Object.entries(deliveryOptions).map(
                            ([id, option]) => (
                              <FieldLabel
                                key={id}
                                className={cn(
                                  "flex cursor-pointer items-start gap-3 rounded-xl border p-4 ",
                                  values.shipping === id
                                    ? "border-primary bg-primary/5"
                                    : "",
                                )}
                              >
                                <RadioGroupItem value={id} />
                                <span className="flex flex-col gap-1">
                                  <span className="block">
                                    {option.label}{" "}
                                    <Badge variant="secondary">
                                      {option.price
                                        ? formatCurrency(option.price)
                                        : "Miễn phí"}
                                    </Badge>
                                  </span>
                                  <span className="block text-xs font-normal text-muted-foreground">
                                    {option.detail}
                                  </span>
                                </span>
                              </FieldLabel>
                            ),
                          )}
                        </RadioGroup>
                      </FieldSet>
                    )}
                    <FieldGroup>
                      <FieldRoot>
                        <FieldLabel htmlFor="purchase-voucher-select">
                          Chọn voucher
                        </FieldLabel>
                        <NativeSelect
                          id="purchase-voucher-select"
                          value={values.voucherCode}
                          onChange={(event) =>
                            change("voucherCode", event.target.value)
                          }
                        >
                          <NativeSelectOption value="">
                            Không dùng mã / nhập mã bên dưới
                          </NativeSelectOption>
                          {vouchers.data
                            ?.filter((v) => v.state === "available")
                            .map((v) => (
                              <NativeSelectOption key={v.id} value={v.code}>
                                {v.code} · {v.name}
                              </NativeSelectOption>
                            ))}
                        </NativeSelect>
                      </FieldRoot>
                      {vouchers.isError && (
                        <Alert variant="destructive">
                          <AlertDescription>
                            {vouchers.error.message}
                          </AlertDescription>
                        </Alert>
                      )}
                      <FieldRoot>
                        <FieldLabel htmlFor="purchase-voucher">
                          Mã giảm giá
                        </FieldLabel>
                        <Input
                          id="purchase-voucher"
                          value={values.voucherCode}
                          maxLength={64}
                          onChange={(event) =>
                            change("voucherCode", event.target.value)
                          }
                          placeholder="Nhập mã, kiểm tra ở bước xác nhận"
                        />
                      </FieldRoot>
                      <FieldRoot data-invalid={Boolean(errors.note)}>
                        <FieldLabel htmlFor="purchase-note">
                          Ghi chú đơn hàng
                        </FieldLabel>
                        <Textarea
                          id="purchase-note"
                          name="note"
                          aria-invalid={Boolean(errors.note)}
                          maxLength={1000}
                          value={values.note}
                          onChange={(event) =>
                            change("note", event.target.value)
                          }
                          placeholder="Lưu ý cho nhân viên giao hàng…"
                        />
                        <ErrorMessage name="note" error={errors.note} />
                      </FieldRoot>
                    </FieldGroup>
                  </>
                )}
                {step === 2 && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Chọn phương thức thanh toán bạn muốn sử dụng.
                    </p>
                    {methods.isError && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          Không tải được phương thức thanh toán.{" "}
                          <Button
                            type="button"
                            variant="link"
                            onClick={() => methods.refetch()}
                          >
                            Thử lại
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                    <RadioGroup
                      value={method}
                      onValueChange={(value) => {
                        setMethod(value);
                        setErrors({});
                      }}
                      className="grid gap-3 sm:grid-cols-2"
                    >
                      {Object.entries(paymentLabels)
                        .filter(
                          ([id]) =>
                            id !== "vnpay" &&
                            !methods.data?.find((item) => item.id === id)
                              ?.hidden,
                        )
                        .map(([id, label]) => {
                          const Icon = paymentIcons[id];
                          return (
                            <FieldLabel
                              key={id}
                              className={cn(
                                "flex cursor-pointer items-start gap-3 rounded-xl border p-4 ",
                                method === id
                                  ? "border-primary bg-primary/5"
                                  : "",
                              )}
                            >
                              <RadioGroupItem
                                value={id}
                                disabled={
                                  submitting ||
                                  !methods.data?.find((item) => item.id === id)
                                    ?.enabled
                                }
                              />
                              <span className="flex flex-col gap-2">
                                <Icon className="size-6 text-primary" />
                                <span className="block">{label}</span>
                              </span>
                            </FieldLabel>
                          );
                        })}
                    </RadioGroup>
                    <ErrorMessage name="payment" error={errors.payment} />
                    <div className="rounded-xl bg-muted/40 p-5 text-sm leading-6 text-muted-foreground">
                      {method === "cod"
                        ? "Thanh toán khi nhận hàng. Bạn có thể kiểm tra lại thông tin ở bước tiếp theo."
                        : "Sau khi đặt đơn, bạn sẽ được chuyển đến trang thanh toán của nhà cung cấp. Chỉ kết quả được server xác minh mới cập nhật trạng thái đơn."}
                    </div>
                    <div className="rounded-xl border p-4">
                      <p className="mb-2 text-sm font-medium">Giao đến</p>
                      <p className="text-sm">
                        {values.name} · {values.phone}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {destination}
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="link"
                        onClick={() => goTo(1)}
                      >
                        Đổi thông tin nhận hàng
                      </Button>
                    </div>
                  </>
                )}
                {step === 3 && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Card className="shadow-none">
                        <CardHeader>
                          <CardTitle className="text-base">
                            Thông tin người nhận
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2 text-sm">
                          <strong>{values.name}</strong>
                          <p>{values.phone}</p>
                          <p className="break-all text-muted-foreground">
                            {values.email}
                          </p>
                          <p className="leading-6">{destination}</p>
                        </CardContent>
                      </Card>
                      <Card className="shadow-none">
                        <CardHeader>
                          <CardTitle className="text-base">
                            Nhận hàng & thanh toán
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2 text-sm">
                          <p>
                            {values.delivery === "store"
                              ? "Nhận tại cửa hàng"
                              : `Giao hàng ${deliveryOptions[values.shipping].label.toLowerCase()}`}
                          </p>
                          <p>{paymentLabels[method]}</p>
                          {values.note && (
                            <p className="whitespace-pre-wrap text-muted-foreground">
                              Ghi chú: {values.note}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                    {quote?.providerCurrency === "USD" && (
                      <p className="text-sm">
                        PayPal: {quote.providerAmount} USD · Tỷ giá{" "}
                        {Number(quote.exchangeRate).toLocaleString("vi-VN")}{" "}
                        VND/USD
                      </p>
                    )}
                    <CardDescription>
                      Kiểm tra sản phẩm và thông tin nhận hàng trước khi đặt
                      hàng. Bạn có thể quay lại các bước để chỉnh sửa. Giá và
                      tồn kho sẽ được kiểm tra lại trên server.
                    </CardDescription>
                  </>
                )}
                <div className="flex flex-wrap justify-between gap-3 border-t pt-5">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={step === 0 || submitting}
                    onClick={() => goTo(step - 1)}
                  >
                    <ArrowLeft data-icon="inline-start" />
                    Quay lại
                  </Button>
                  <Button
                    type="submit"
                    disabled={!selectedItems.length || submitting || !user}
                  >
                    {submitting
                      ? "Đang xử lý…"
                      : step === 3
                        ? "Đặt hàng"
                        : step === 0
                          ? "Chọn địa chỉ nhận hàng"
                          : step === 1
                            ? "Chọn thanh toán"
                            : "Kiểm tra thông tin"}
                    <ArrowRight data-icon="inline-start" />
                  </Button>
                </div>
              </section>
              <aside className="min-w-0 xl:sticky xl:top-32">
                <OrderSummary
                  items={selectedItems}
                  subtotal={quote?.subtotal ?? selectedTotal}
                  discount={quote?.discount ?? 0}
                  shipping={quote?.shipping ?? shipping}
                />
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  {quote
                    ? "Giá đã được tính từ hệ thống. Server sẽ kiểm tra lại khi đặt hàng."
                    : "Tổng tiền sẽ được xác nhận từ hệ thống ở bước kiểm tra."}
                </p>
              </aside>
            </FieldGroup>
          </form>
          {addingAddress && (
            <AddressBookDialog
              open={addingAddress}
              onOpenChange={setAddingAddress}
              user={user}
              onSave={async (data) => {
                const address = await addressBook.create.mutateAsync(data);
                change("addressId", address.id);
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
Field.propTypes = {
  label: PropTypes.node,
  name: PropTypes.string,
  value: PropTypes.node,
  onChange: PropTypes.func,
  error: PropTypes.object,
  type: PropTypes.string,
  autoComplete: PropTypes.string,
  readOnly: PropTypes.bool,
};
ErrorMessage.propTypes = {
  name: PropTypes.string,
  error: PropTypes.object,
};
