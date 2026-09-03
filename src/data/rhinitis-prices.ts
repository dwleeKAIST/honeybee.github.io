// 코편안 클리닉 — 첩약 건강보험 안내값.
// 이 파일만 수정하면 /rhinitis/ 페이지에 반영됩니다.
// 비급여 한약 비용은 원장 요청에 따라 페이지에 표시하지 않습니다.

export const chuppyakInsurance = {
  disease: '알레르기비염',
  amount: '10일분',
  patientPay: '3~5만원',
  // 실손보험은 가입하신 상품에 따라 달라지므로 단정하지 않습니다.
  privateInsuranceNote:
    '실손보험에 가입되어 있으시면 보장 범위에 따라 부담이 더 줄어들 수 있습니다. 적용 여부와 금액은 가입하신 상품에 따라 다릅니다.',
} as const;
