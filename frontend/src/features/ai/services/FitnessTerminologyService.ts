/**
 * 健身专业术语解释服务
 * Fitness terminology explanation service
 */

export interface TermExplanation {
    term: string;
    category: 'training' | 'anatomy' | 'nutrition' | 'equipment' | 'technique';
    definition: string;
    definitionZh: string;
    examples?: string[];
    relatedTerms?: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export class FitnessTerminologyService {
    private static readonly TERMS_DATABASE: TermExplanation[] = [
        // 训练相关术语
        {
            term: 'Progressive Overload',
            category: 'training',
            definition: 'Gradually increasing weight, reps, or sets to continuously challenge muscles',
            definitionZh: '渐进式超负荷：逐渐增加重量、次数或组数来持续挑战肌肉',
            examples: ['Adding 2.5kg to bench press each week', 'Increasing reps from 8 to 10'],
            relatedTerms: ['Volume', 'Intensity', 'Periodization'],
            difficulty: 'intermediate'
        },
        {
            term: 'Compound Exercise',
            category: 'training',
            definition: 'Multi-joint movements that work multiple muscle groups simultaneously',
            definitionZh: '复合动作：同时锻炼多个肌肉群的多关节运动',
            examples: ['Deadlift', 'Squat', 'Bench Press', 'Pull-up'],
            relatedTerms: ['Isolation Exercise', 'Multi-joint'],
            difficulty: 'beginner'
        },
        {
            term: 'Isolation Exercise',
            category: 'training',
            definition: 'Single-joint movements targeting specific muscle groups',
            definitionZh: '孤立动作：针对特定肌肉群的单关节运动',
            examples: ['Bicep Curl', 'Leg Extension', 'Lateral Raise'],
            relatedTerms: ['Compound Exercise', 'Single-joint'],
            difficulty: 'beginner'
        },
        {
            term: 'Volume',
            category: 'training',
            definition: 'Total amount of work performed (sets × reps × weight)',
            definitionZh: '训练量：执行的总工作量（组数 × 次数 × 重量）',
            examples: ['3 sets × 10 reps × 100kg = 3000kg volume'],
            relatedTerms: ['Intensity', 'Frequency', 'Progressive Overload'],
            difficulty: 'intermediate'
        },
        {
            term: 'Pump',
            category: 'training',
            definition: 'Temporary muscle swelling from increased blood flow during exercise',
            definitionZh: '泵感：运动时血流增加导致的肌肉暂时肿胀感',
            examples: ['Feeling tight and full muscles after high-rep sets'],
            relatedTerms: ['Blood Flow', 'Muscle Hypertrophy'],
            difficulty: 'beginner'
        },
        {
            term: 'Time Under Tension',
            category: 'technique',
            definition: 'Duration muscles are under stress during an exercise set',
            definitionZh: '张力时间：肌肉在一组练习中承受压力的持续时间',
            examples: ['2 seconds up, 3 seconds down = 5 seconds per rep'],
            relatedTerms: ['Tempo', 'Eccentric', 'Concentric'],
            difficulty: 'intermediate'
        },
        {
            term: 'Eccentric',
            category: 'technique',
            definition: 'Muscle lengthening phase of movement (lowering weight)',
            definitionZh: '离心收缩：肌肉拉长阶段的运动（降低重量）',
            examples: ['Lowering the bar in bench press', 'Going down in squat'],
            relatedTerms: ['Concentric', 'Isometric', 'Negative'],
            difficulty: 'intermediate'
        },
        {
            term: 'Concentric',
            category: 'technique',
            definition: 'Muscle shortening phase of movement (lifting weight)',
            definitionZh: '向心收缩：肌肉缩短阶段的运动（举起重量）',
            examples: ['Pressing the bar up in bench press', 'Standing up in squat'],
            relatedTerms: ['Eccentric', 'Isometric', 'Positive'],
            difficulty: 'intermediate'
        },
        {
            term: 'Hypertrophy',
            category: 'training',
            definition: 'Muscle growth through increased muscle fiber size',
            definitionZh: '肌肉肥大：通过增加肌纤维大小实现的肌肉增长',
            examples: ['8-12 rep range optimal for hypertrophy'],
            relatedTerms: ['Muscle Growth', 'Protein Synthesis', 'Volume'],
            difficulty: 'intermediate'
        },
        {
            term: 'Periodization',
            category: 'training',
            definition: 'Systematic planning of training phases to optimize performance',
            definitionZh: '周期化训练：系统性规划训练阶段以优化表现',
            examples: ['4-week strength phase followed by 4-week hypertrophy phase'],
            relatedTerms: ['Mesocycle', 'Macrocycle', 'Deload'],
            difficulty: 'advanced'
        },
        {
            term: 'Deload',
            category: 'training',
            definition: 'Planned reduction in training intensity to promote recovery',
            definitionZh: '减量训练：有计划地降低训练强度以促进恢复',
            examples: ['Using 60% of normal weight for one week'],
            relatedTerms: ['Recovery', 'Periodization', 'Overreaching'],
            difficulty: 'intermediate'
        },
        {
            term: 'DOMS',
            category: 'training',
            definition: 'Delayed Onset Muscle Soreness - muscle pain 24-72 hours after exercise',
            definitionZh: '延迟性肌肉酸痛：运动后24-72小时出现的肌肉疼痛',
            examples: ['Sore legs two days after leg workout'],
            relatedTerms: ['Recovery', 'Muscle Damage', 'Inflammation'],
            difficulty: 'beginner'
        },
        // 解剖学术语
        {
            term: 'Anterior',
            category: 'anatomy',
            definition: 'Front side of the body',
            definitionZh: '前侧：身体的前面',
            examples: ['Anterior deltoid (front shoulder)'],
            relatedTerms: ['Posterior', 'Medial', 'Lateral'],
            difficulty: 'intermediate'
        },
        {
            term: 'Posterior',
            category: 'anatomy',
            definition: 'Back side of the body',
            definitionZh: '后侧：身体的后面',
            examples: ['Posterior deltoid (rear shoulder)'],
            relatedTerms: ['Anterior', 'Medial', 'Lateral'],
            difficulty: 'intermediate'
        },
        // 营养术语
        {
            term: 'Protein Synthesis',
            category: 'nutrition',
            definition: 'Process of building new proteins in muscle tissue',
            definitionZh: '蛋白质合成：在肌肉组织中构建新蛋白质的过程',
            examples: ['Enhanced by consuming protein after workout'],
            relatedTerms: ['Amino Acids', 'Recovery', 'Muscle Growth'],
            difficulty: 'intermediate'
        },
        {
            term: 'Anabolic Window',
            category: 'nutrition',
            definition: 'Post-workout period when muscle protein synthesis is elevated',
            definitionZh: '合成窗口期：训练后肌肉蛋白质合成增强的时期',
            examples: ['30-60 minutes after workout'],
            relatedTerms: ['Protein Synthesis', 'Recovery', 'Post-workout Nutrition'],
            difficulty: 'intermediate'
        }
    ];

    /**
     * 搜索术语解释
     * Search for term explanations
     */
    static searchTerms(query: string, category?: string): TermExplanation[] {
        const normalizedQuery = query.toLowerCase().trim();

        return this.TERMS_DATABASE.filter(term => {
            const matchesQuery =
                term.term.toLowerCase().includes(normalizedQuery) ||
                term.definition.toLowerCase().includes(normalizedQuery) ||
                term.definitionZh.includes(normalizedQuery) ||
                term.examples?.some(example => example.toLowerCase().includes(normalizedQuery)) ||
                term.relatedTerms?.some(related => related.toLowerCase().includes(normalizedQuery));

            const matchesCategory = !category || term.category === category;

            return matchesQuery && matchesCategory;
        });
    }

    /**
     * 获取特定术语的解释
     * Get explanation for a specific term
     */
    static getTermExplanation(term: string): TermExplanation | null {
        const normalizedTerm = term.toLowerCase().trim();
        return this.TERMS_DATABASE.find(t =>
            t.term.toLowerCase() === normalizedTerm
        ) || null;
    }

    /**
     * 获取相关术语
     * Get related terms
     */
    static getRelatedTerms(term: string): TermExplanation[] {
        const mainTerm = this.getTermExplanation(term);
        if (!mainTerm || !mainTerm.relatedTerms) return [];

        return mainTerm.relatedTerms
            .map(relatedTerm => this.getTermExplanation(relatedTerm))
            .filter(Boolean) as TermExplanation[];
    }

    /**
     * 按类别获取术语
     * Get terms by category
     */
    static getTermsByCategory(category: string): TermExplanation[] {
        return this.TERMS_DATABASE.filter(term => term.category === category);
    }

    /**
     * 按难度获取术语
     * Get terms by difficulty
     */
    static getTermsByDifficulty(difficulty: string): TermExplanation[] {
        return this.TERMS_DATABASE.filter(term => term.difficulty === difficulty);
    }

    /**
     * 获取所有可用类别
     * Get all available categories
     */
    static getCategories(): string[] {
        const categories = new Set(this.TERMS_DATABASE.map(term => term.category));
        return Array.from(categories);
    }

    /**
     * 智能术语检测 - 从文本中检测可能的专业术语
     * Smart term detection - detect potential technical terms from text
     */
    static detectTermsInText(text: string): TermExplanation[] {
        const normalizedText = text.toLowerCase();
        const detectedTerms: TermExplanation[] = [];

        this.TERMS_DATABASE.forEach(term => {
            if (normalizedText.includes(term.term.toLowerCase())) {
                detectedTerms.push(term);
            }
        });

        return detectedTerms;
    }

    /**
     * 生成术语解释的HTML格式
     * Generate HTML format for term explanation
     */
    static formatTermExplanation(term: TermExplanation): string {
        let html = `<div class="term-explanation">`;
        html += `<h3 class="term-title">${term.term}</h3>`;
        html += `<p class="term-definition">${term.definitionZh}</p>`;
        html += `<p class="term-definition-en">${term.definition}</p>`;

        if (term.examples && term.examples.length > 0) {
            html += `<div class="term-examples">`;
            html += `<h4>示例：</h4>`;
            html += `<ul>`;
            term.examples.forEach(example => {
                html += `<li>${example}</li>`;
            });
            html += `</ul></div>`;
        }

        if (term.relatedTerms && term.relatedTerms.length > 0) {
            html += `<div class="related-terms">`;
            html += `<h4>相关术语：</h4>`;
            html += `<p>${term.relatedTerms.join(', ')}</p>`;
            html += `</div>`;
        }

        html += `</div>`;
        return html;
    }

    /**
     * 为AI推荐添加术语解释
     * Add term explanations to AI recommendations
     */
    static enhanceRecommendationWithTerms(recommendationText: string): {
        originalText: string;
        detectedTerms: TermExplanation[];
        enhancedText: string;
    } {
        const detectedTerms = this.detectTermsInText(recommendationText);
        let enhancedText = recommendationText;

        // 为检测到的术语添加解释标记
        detectedTerms.forEach(term => {
            const regex = new RegExp(`\\b${term.term}\\b`, 'gi');
            enhancedText = enhancedText.replace(regex, `<span class="term-highlight" data-term="${term.term}">${term.term}</span>`);
        });

        return {
            originalText: recommendationText,
            detectedTerms,
            enhancedText
        };
    }
}

export default FitnessTerminologyService;