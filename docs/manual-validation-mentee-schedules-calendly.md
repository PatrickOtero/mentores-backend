# Checklist manual - histórico do mentorado e fluxo Calendly

1. Fazer login com uma conta no contexto de mentorado.
2. Escolher mentor, data e horário no portal.
3. Confirmar no banco que o backend criou um registro interno com status `PENDING`.
4. Continuar para o Calendly.
5. Confirmar que o link ainda abre na etapa final/confirmatória.
6. Finalizar o agendamento no Calendly.
7. Voltar ao portal e abrir a aba `Agendamentos`.
8. Confirmar que o backend reconciliou o item para `SCHEDULED`, quando o evento já puder ser identificado via Calendly.
9. Confirmar que o item aparece corretamente no histórico do mentorado.
10. Validar com outro mentorado autenticado que o agendamento não fica visível para terceiros.
11. Validar que o histórico do mentor continua funcionando sem regressão.
