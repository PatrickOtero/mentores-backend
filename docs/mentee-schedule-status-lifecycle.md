# Ciclo interno de status do agendamento do mentorado

## Quando o registro é criado

O registro interno é criado no backend antes do redirecionamento para o Calendly, dentro do fluxo `POST /calendly/mentor/:mentorId/invitees`.

Nesse momento o Portal já conhece:

- mentor escolhido;
- mentorado autenticado no contexto ativo;
- data e horário selecionados;
- timezone do navegador;
- descrição informada no portal;
- `scheduling_url` do slot selecionado.

Com esses dados, o Portal grava um item em `history` com status `PENDING`.

## Quando o status muda para `SCHEDULED`

Como o fluxo continua usando apenas a integração gratuita do Calendly, sem Scheduling API e sem recurso pago, a transição automática acontece quando o backend consegue identificar o evento confirmado ao consultar os eventos futuros da conta Calendly do mentor.

Hoje isso ocorre na reconciliação usada pela listagem do mentorado em `GET /calendly/mentee/schedules`.

Quando o evento confirmado é encontrado, o mesmo registro interno é atualizado para `SCHEDULED` com os dados disponíveis do Calendly, como:

- `calendlyEventUri`;
- `calendlyEventUuid`;
- `calendlyInviteeUri`;
- `joinUrl`;
- `cancelUrl`;
- `rescheduleUrl`.

## Origem dos dados

Dados vindos do Portal:

- `mentor_id`;
- `mentee_id`;
- `startTime`;
- `endTime` calculado a partir da duração do evento;
- `timezone`;
- `description`;
- `schedulingUrl`;
- status inicial `PENDING`.

Dados vindos do Calendly:

- URIs e UUIDs externos do evento;
- link da reunião;
- links de cancelamento e reagendamento;
- confirmação efetiva do agendamento para promoção a `SCHEDULED`.

## Limitações atuais

- Não existe callback dedicado de confirmação do agendamento no projeto hoje.
- Por isso, a transição de `PENDING` para `SCHEDULED` depende da próxima reconciliação com o Calendly via backend.
- A listagem do mentorado continua consolidando registros internos, eventos futuros do Calendly e histórico concluído sem duplicar o mesmo agendamento.
