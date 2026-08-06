/**
 * 肌肉群映射服务
 * Muscle Group Mapping Service
 * 
 * 根据练习名称自动识别肌肉群
 * Automatically identify muscle groups based on exercise names
 */

// 肌肉群枚举（与前端保持一致）
const MuscleGroup = {
    CHEST: 'Chest',
    LATS: 'Lats',
    TRAPS: 'Traps',
    LOWER_BACK: 'Lower Back',
    BICEPS: 'Biceps',
    TRICEPS: 'Triceps',
    FOREARMS: 'Forearms',
    SHOULDERS: 'Shoulders',
    ABS: 'Abs',
    OBLIQUES: 'Obliques',
    QUADS: 'Quads',
    HAMSTRINGS: 'Hamstrings',
    CALVES: 'Calves',
    GLUTES: 'Glutes',
    CARDIO: 'Cardio'
};

// 练习名称关键词到肌肉群的映射
const EXERCISE_KEYWORDS_MAP = {
    // 胸部 Chest
    [MuscleGroup.CHEST]: [
        '卧推', '推胸', '飞鸟', '夹胸', '胸推', '胸部',
        'bench press', 'chest press', 'fly', 'flyes', 'pec', 'chest',
        'push up', 'pushup', 'dip'
    ],

    // 背阔肌 Lats
    [MuscleGroup.LATS]: [
        '引体', '下拉', '划船', '背阔', '高位下拉',
        'pull up', 'pullup', 'lat', 'pulldown', 'row',
        'chin up', 'chinup'
    ],

    // 斜方肌 Traps
    [MuscleGroup.TRAPS]: [
        '耸肩', '斜方', '提拉',
        'shrug', 'trap', 'upright row'
    ],

    // 下背部 Lower Back
    [MuscleGroup.LOWER_BACK]: [
        '硬拉', '山羊挺身', '下背', '背屈伸',
        'deadlift', 'lower back', 'back extension', 'hyperextension',
        'good morning'
    ],

    // 二头肌 Biceps
    [MuscleGroup.BICEPS]: [
        '弯举', '二头', '臂弯',
        'curl', 'bicep', 'biceps'
    ],

    // 三头肌 Triceps
    [MuscleGroup.TRICEPS]: [
        '臂屈伸', '三头', '下压', '颈后臂屈伸',
        'extension', 'tricep', 'triceps', 'pushdown', 'press down',
        'skull crusher', 'overhead extension'
    ],

    // 前臂 Forearms
    [MuscleGroup.FOREARMS]: [
        '腕弯举', '前臂', '握力',
        'wrist curl', 'forearm', 'grip'
    ],

    // 肩部 Shoulders
    [MuscleGroup.SHOULDERS]: [
        '推举', '侧平举', '前平举', '肩推', '肩部', '三角肌',
        'press', 'shoulder', 'lateral raise', 'front raise',
        'overhead', 'military press', 'arnold press', 'delt'
    ],

    // 腹肌 Abs
    [MuscleGroup.ABS]: [
        '卷腹', '仰卧起坐', '腹肌', '核心', '平板支撑',
        'crunch', 'sit up', 'situp', 'ab', 'abs', 'core',
        'plank', 'leg raise'
    ],

    // 腹斜肌 Obliques
    [MuscleGroup.OBLIQUES]: [
        '侧卷腹', '俄罗斯转体', '腹斜',
        'oblique', 'russian twist', 'side crunch', 'wood chop'
    ],

    // 股四头肌 Quads
    [MuscleGroup.QUADS]: [
        '深蹲', '腿屈伸', '股四', '前蹲',
        'squat', 'leg extension', 'quad', 'front squat',
        'lunge', 'leg press'
    ],

    // 腘绳肌 Hamstrings
    [MuscleGroup.HAMSTRINGS]: [
        '腿弯举', '腘绳', '罗马尼亚硬拉',
        'leg curl', 'hamstring', 'romanian deadlift', 'rdl'
    ],

    // 小腿 Calves
    [MuscleGroup.CALVES]: [
        '提踵', '小腿',
        'calf raise', 'calf', 'calves'
    ],

    // 臀部 Glutes
    [MuscleGroup.GLUTES]: [
        '臀推', '臀桥', '臀部', '髋外展',
        'hip thrust', 'glute bridge', 'glute', 'glutes',
        'hip abduction', 'kickback'
    ],

    // 有氧 Cardio
    [MuscleGroup.CARDIO]: [
        '跑步', '骑行', '划船机', '有氧', '椭圆机',
        'run', 'running', 'bike', 'cycling', 'rowing',
        'cardio', 'elliptical', 'treadmill'
    ]
};

/**
 * 根据练习名称识别肌肉群
 * @param {string} exerciseName - 练习名称（中文或英文）
 * @returns {string} 肌肉群名称
 */
function identifyMuscleGroup(exerciseName) {
    if (!exerciseName) {
        console.warn('⚠️ 练习名称为空，使用默认肌肉群 Chest');
        return MuscleGroup.CHEST;
    }

    const nameLower = exerciseName.toLowerCase().trim();

    // 遍历所有肌肉群，查找匹配的关键词
    for (const [muscleGroup, keywords] of Object.entries(EXERCISE_KEYWORDS_MAP)) {
        for (const keyword of keywords) {
            if (nameLower.includes(keyword.toLowerCase())) {
                console.log(`✅ 识别肌肉群: "${exerciseName}" -> ${muscleGroup} (关键词: ${keyword})`);
                return muscleGroup;
            }
        }
    }

    // 如果没有匹配到，返回默认值
    console.warn(`⚠️ 未能识别肌肉群: "${exerciseName}"，使用默认值 Chest`);
    return MuscleGroup.CHEST;
}

/**
 * 批量识别多个练习的肌肉群
 * @param {Array<{name: string}>} exercises - 练习数组
 * @returns {Array<{name: string, muscleGroup: string}>} 带肌肉群信息的练习数组
 */
function identifyMuscleGroupsForExercises(exercises) {
    if (!Array.isArray(exercises)) {
        console.error('❌ exercises 参数必须是数组');
        return [];
    }

    return exercises.map(exercise => {
        const muscleGroup = identifyMuscleGroup(exercise.name);
        return {
            ...exercise,
            muscleGroup: muscleGroup,
            muscleGroups: [muscleGroup] // 保持向后兼容
        };
    });
}

/**
 * 获取所有支持的肌肉群列表
 * @returns {Array<string>} 肌肉群列表
 */
function getAllMuscleGroups() {
    return Object.values(MuscleGroup);
}

/**
 * 验证肌肉群是否有效
 * @param {string} muscleGroup - 肌肉群名称
 * @returns {boolean} 是否有效
 */
function isValidMuscleGroup(muscleGroup) {
    return Object.values(MuscleGroup).includes(muscleGroup);
}

module.exports = {
    MuscleGroup,
    identifyMuscleGroup,
    identifyMuscleGroupsForExercises,
    getAllMuscleGroups,
    isValidMuscleGroup
};
