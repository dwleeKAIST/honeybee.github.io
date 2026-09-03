// 코편안 클리닉 한약 비용 — 이 파일만 수정하면 /rhinitis/ 페이지에 반영됩니다.
// 비급여 진료비용은 의료법에 따라 고지하는 항목입니다.
// ⚠ 확인 필요: 맞춤 한약·녹용 한약의 세 가지 구성이 각각 어떤 복용 기간인지.
//    확인되면 period 값을 채우세요. 비워두면 금액만 표시됩니다.

export const rhinitisPrices = [
  {
    name: '맞춤 한약',
    note: '진찰 후 개별 상태에 맞추어 처방합니다.',
    tiers: [
      { period: '', price: '50만원' },
      { period: '', price: '85만원' },
      { period: '', price: '120만원' },
    ],
  },
  {
    name: '녹용 한약',
    note: '녹용을 함께 넣어 처방하는 구성입니다.',
    tiers: [
      { period: '', price: '70만원' },
      { period: '', price: '119만원' },
      { period: '', price: '168만원' },
    ],
  },
] as const;

// 첩약 건강보험 — 알레르기비염은 적용 가능 상병입니다.
export const chuppyakInsurance = {
  disease: '알레르기비염',
  amount: '10일분',
  patientPay: '3~5만원',
  // 실손보험은 가입하신 상품에 따라 달라지므로 단정하지 않습니다.
  privateInsuranceNote: '실손보험에 가입되어 있으시면 보장 범위에 따라 부담이 더 줄어들 수 있습니다. 적용 여부와 금액은 가입하신 상품에 따라 다릅니다.',
} as const;
