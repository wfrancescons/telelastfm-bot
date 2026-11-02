import { logCommand } from "@/database/services/commandLogs.ts";
import type { BotContext } from "@/types/context.ts";
import { FormattedString } from "@grammyjs/parse-mode";

export default async function handlePrivacy(ctx: BotContext) {
  const telegram_id = ctx.from?.id;
  const chat_id = ctx.chat?.id;

  if (!telegram_id || !chat_id) {
    return;
  }

  logCommand("privacy", telegram_id, chat_id);

  try {
    ctx.replyWithChatAction("typing").catch(() => {});

    const msg = FormattedString
      .bold("Termos de Uso e Política de Privacidade do telelastfm\n\n")
      .bold("1. Coleta de Dados\n")
      .plain(
        "O telelastfm coleta apenas as informações essenciais para oferecer uma experiência personalizada. Os dados coletados são:\n",
      )
      .plain("- ")
      .bold("Informações do usuário no Telegram:")
      .plain(" ID, primeiro nome e nome de usuário.\n")
      .plain("- ")
      .bold("Dados enviados ao bot:")
      .plain(" Nome de usuário do Last.fm.\n")
      .plain("- ")
      .bold("Informações do Last.fm:")
      .plain(" Nome de usuário e contagem de reproduções.\n\n")
      .bold("2. Uso de Dados\n")
      .plain(
        "Os dados coletados são utilizados exclusivamente para o funcionamento do bot e para melhorar a experiência do usuário.\n",
      )
      .plain("- ")
      .bold("Informações do Telegram:")
      .plain(" Usadas para identificação e comunicação.\n")
      .plain("- ")
      .bold("Informações do Last.fm:")
      .plain(" Utilizadas para integrar e personalizar os serviços.\n\n")
      .bold("3. Compartilhamento de Dados\n")
      .plain(
        "Os dados não são compartilhados com terceiros, exceto quando exigido por lei. Todas as informações são armazenadas com segurança.\n\n",
      )
      .bold("4. Dados fornecidos pelo Last.fm\n")
      .plain(
        "Nomes de faixas, álbuns, artistas, tags, contagem de reproduções e imagens são fornecidos pelo Last.fm. Qualquer divergência, reivindicação, reclamação ou solicitação deve ser tratada diretamente no site ",
      )
      .link("last.fm", "https://last.fm")
      .plain(".\n\n")
      .bold("Observação: ")
      .italic(
        "As informações do Telegram são públicas e não revelam seus dados pessoais reais.",
      );

    await ctx.reply(msg.text, {
      entities: msg.entities,
      reply_parameters: ctx.message
        ? { message_id: ctx.message.message_id }
        : undefined,
    });
  } catch (error) {
    console.error("Error in handlePrivacy:", error);
  }
}

