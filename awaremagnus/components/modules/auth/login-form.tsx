"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Checkbox } from "@heroui/checkbox";
import { Link } from "@heroui/link";
import NextLink from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useLogin } from "@/services/authHooks";
import { useTranslations } from "@/i18n/useTranslations";
import { getApiErrorMessage } from "@/utils/apiError";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const t = useTranslations("login");
  const tCommon = useTranslations("common");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const loginMutation = useLogin();

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);

    try {
      await loginMutation.mutateAsync({
        email: values.email.trim(),
        password: values.password,
        rememberMe: values.rememberMe ?? false,
      });
    } catch (error: any) {
      const message = getApiErrorMessage(error, t, {
        defaultKey: "form.errors.invalidCredentials",
        defaultValue: t("form.errors.invalidCredentials", {
          defaultValue: "Invalid email or password.",
        }),
      });

      setFormError(message);
    }
  };

  return (
    <form className="flex flex-col items-stretch w-full" onSubmit={handleSubmit(onSubmit)}>
      <h3 className="text-center text-3xl font-semibold">
        {t("form.title", { appName: tCommon("appName") })}
      </h3>

      <div className="mt-6 md:mt-10">
        <div>
          <Input
            id="email"
            placeholder={t("form.emailPlaceholder")}
            type="email"
            {...register("email")}
            isRequired
            classNames={{
              base: "w-full",
              inputWrapper:
                "px-5 py-3.5 rounded-full bg-[var(--gray)] border border-[var(--strokeGray)] focus-within:border-[var(--blue)] transition-colors duration-300",
              input: "bg-transparent text-[14px]",
            }}
            errorMessage={errors.email?.message}
            isInvalid={!!errors.email}
          />
        </div>

        <div className="mt-3">
          <Input
            id="password"
            placeholder={t("form.passwordPlaceholder")}
            type="password"
            {...register("password")}
            isRequired
            classNames={{
              base: "w-full",
              inputWrapper:
                "px-5 py-3.5 rounded-full bg-[var(--gray)] border border-[var(--strokeGray)] focus-within:border-[var(--blue)] transition-colors duration-300",
              input: "bg-transparent text-[14px]",
            }}
          />
        </div>

        <div className="flex justify-between mt-3">
          <Checkbox
            id="rememberMe"
            {...register("rememberMe")}
            classNames={{
              wrapper: "after:bg-[var(--blue)] after:border-[var(--blue)]",
            }}
          >
            <span className="text-sm">{t("form.rememberMe")}</span>
          </Checkbox>

          <Link
            as={NextLink}
            className="text-[var(--blue)] text-xs hover:underline"
            href="/forgot-password"
            size="sm"
          >
            {t("form.forgotPassword")}
          </Link>
        </div>

        {formError && <p className="mt-4 text-sm text-red-500 text-center">{formError}</p>}

        <Button
          className="w-full mt-8 px-6 py-3 rounded-full bg-[var(--blue)] text-white border border-transparent transition-all duration-300 hover:bg-transparent hover:border-[var(--blue)] hover:text-[var(--blue)]"
          isLoading={isSubmitting || loginMutation.isPending}
          radius="full"
          type="submit"
        >
          {t("form.loginButton")}
        </Button>

        <p className="text-default-500 mt-4 text-center text-sm md:mt-6">
          {t("form.noAccount")}
          <Link
            as={NextLink}
            className="text-[var(--blue)] ms-1 hover:underline"
            href="/signup"
            size="sm"
          >
            {t("form.signup")}
          </Link>
        </p>
      </div>
    </form>
  );
};
