import type { AIAnalysisProvider } from './types'

export const mockAnalysisProvider: AIAnalysisProvider = {
  async analyze(request) {
    return {
      summary: '画面以大面积深色作为视觉基底，配合高亮强调色形成明确的视觉重心。',
      subjects: ['几何色块', '高亮主体', '深色背景'],
      scene: '抽象的测试构图，用于验证图像理解与设计分析流程。',
      composition: '左侧深色区域稳定画面，右侧色块形成视觉引导。',
      lighting: '明暗对比明确，亮部具有较强吸引力。',
      styleTags: ['极简', '高对比', '编辑式'],
      suitableUseCases: request.domain === 'web-ui' ? ['深色工具界面', '作品集首屏'] : ['几何海报', '实验性封面'],
      paletteRoles: [
        { role: 'background', rationale: '深色面积最大，适合作为稳定背景而不是行动色。' },
        { role: 'accent', rationale: '高亮黄绿色与背景形成强烈对比，应控制使用面积。' },
      ],
      recommendations: [
        { title: '限制强调色比例', rationale: '高饱和色容易压过信息层级。', action: '仅用于主按钮、焦点和当前状态。' },
        { title: '保留中性文字层级', rationale: '彩色表面过多会削弱可读性。', action: '正文使用中性浅色，避免直接继承背景主色。' },
      ],
      uncertainties: ['测试图没有真实语义主体，报告不对现实场景做额外推断。'],
      provider: 'mock',
      model: 'deterministic-visual-v1',
    }
  },
}
