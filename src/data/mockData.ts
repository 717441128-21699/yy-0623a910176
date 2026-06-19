import { Chapter, VoiceOption, VoiceSettings, HighlightWord } from '@/types';
import { generateId } from '@/utils/textUtils';

export const mockChapters: Chapter[] = [
  {
    id: 'chapter_001',
    title: '平凡的世界 第一章',
    paragraphs: [
      {
        id: generateId(),
        text: '一九七五年二三月间，一个平平常常的日子，细濛濛的雨丝夹着一星半点的雪花，正纷纷淋淋地向大地飘洒着。时令已快到惊蛰，雪当然再不会存留，往往还没等落地，就已经消失得无踪无影了。',
        highlights: ['黄土高原', '双水村'],
      },
      {
        id: generateId(),
        text: '黄土高原严寒而漫长的冬天看来就要过去，但那真正温暖的春天还远远地没有到来。',
        highlights: ['黄土高原'],
      },
      {
        id: generateId(),
        text: '在这样雨雪交加的日子里，如果没有什么紧要事，人们宁愿一整天足不出户。因此，县城的大街小巷倒也比平时少了许多嘈杂。',
        highlights: ['县城'],
      },
      {
        id: generateId(),
        text: '只有那些山顶上还戴着白帽子的群山，才用它们那种沉默肃穆的神态，陪伴着这个沉睡的小城。',
        highlights: [],
      },
    ],
    createdAt: Date.now() - 86400000 * 2,
    rawText: '一九七五年二三月间，一个平平常常的日子，细濛濛的雨丝夹着一星半点的雪花，正纷纷淋淋地向大地飘洒着。时令已快到惊蛰，雪当然再不会存留，往往还没等落地，就已经消失得无踪无影了。\n\n黄土高原严寒而漫长的冬天看来就要过去，但那真正温暖的春天还远远地没有到来。\n\n在这样雨雪交加的日子里，如果没有什么紧要事，人们宁愿一整天足不出户。因此，县城的大街小巷倒也比平时少了许多嘈杂。\n\n只有那些山顶上还戴着白帽子的群山，才用它们那种沉默肃穆的神态，陪伴着这个沉睡的小城。',
  },
  {
    id: 'chapter_002',
    title: '射雕英雄传 节选',
    paragraphs: [
      {
        id: generateId(),
        text: '钱塘江浩浩江水，日日夜夜无穷无休的从临安牛家村边绕过，东流入海。江畔一排数十株乌柏树，叶子似火烧般红，正是八月天时。',
        highlights: ['钱塘江', '牛家村'],
      },
      {
        id: generateId(),
        text: '村前村后的野草刚起始变黄，一抹斜阳映照之下，更增了几分萧索。两株大松树下围着一堆村民，男男女女和十几个小孩，正自聚精会神的听着一个瘦削的老者说话。',
        highlights: [],
      },
      {
        id: generateId(),
        text: '那说话人五十来岁年纪，一件青布长袍早洗得褪成了蓝灰色。只听他两片梨花木板碰了几下，左手中竹棒在一面小羯鼓上敲起得得连声。',
        highlights: [],
      },
    ],
    createdAt: Date.now() - 86400000 * 5,
    rawText: '钱塘江浩浩江水，日日夜夜无穷无休的从临安牛家村边绕过，东流入海。江畔一排数十株乌柏树，叶子似火烧般红，正是八月天时。\n\n村前村后的野草刚起始变黄，一抹斜阳映照之下，更增了几分萧索。两株大松树下围着一堆村民，男男女女和十几个小孩，正自聚精会神的听着一个瘦削的老者说话。\n\n那说话人五十来岁年纪，一件青布长袍早洗得褪成了蓝灰色。只听他两片梨花木板碰了几下，左手中竹棒在一面小羯鼓上敲起得得连声。',
  },
  {
    id: 'chapter_003',
    title: '乡村爱情故事',
    paragraphs: [
      {
        id: generateId(),
        text: '榆树湾村的早晨，大公鸡一叫，整个村子就醒了。王大娘推开院门，深深吸了一口带着露水和泥土气息的空气，心里说不出的舒坦。',
        highlights: ['榆树湾村'],
      },
      {
        id: generateId(),
        text: '今天是个好日子，儿子二狗要带媳妇回来了。王大娘从昨天就开始忙活，把里里外外打扫得干干净净，还特意杀了一只下蛋的老母鸡。',
        highlights: ['二狗'],
      },
    ],
    createdAt: Date.now() - 86400000,
    rawText: '榆树湾村的早晨，大公鸡一叫，整个村子就醒了。王大娘推开院门，深深吸了一口带着露水和泥土气息的空气，心里说不出的舒坦。\n\n今天是个好日子，儿子二狗要带媳妇回来了。王大娘从昨天就开始忙活，把里里外外打扫得干干净净，还特意杀了一只下蛋的老母鸡。',
  },
];

export const voiceOptions: VoiceOption[] = [
  {
    type: 'slow',
    name: '慢速旁白',
    description: '语速缓慢，咬字清晰，适合听力不好的老人',
    sample: '各位听众朋友们，大家好~',
  },
  {
    type: 'female',
    name: '清亮女声',
    description: '声音明亮温柔，适合情感类和乡村故事',
    sample: '春天来了，花儿都开了~',
  },
  {
    type: 'male',
    name: '沉稳男声',
    description: '声音低沉有力，适合武侠和历史题材',
    sample: '话说天下大势，分久必合~',
  },
  {
    type: 'dialect',
    name: '方言味道',
    description: '略带地方口音，亲切接地气，家乡的感觉',
    sample: '话说那一天啊，可热闹嘞~',
  },
];

export const defaultVoiceSettings: VoiceSettings = {
  voiceType: 'slow',
  speedLevel: 2,
  volume: 85,
  pauseBetweenParagraphs: 2,
};

export const defaultHighlights: HighlightWord[] = [
  { id: 'h1', word: '孙少安', type: 'name', note: '主角名字' },
  { id: 'h2', word: '双水村', type: 'place', note: '故事发生地点' },
  { id: 'h3', word: '郭靖', type: 'name', note: '射雕主角' },
];

export const sleepTimerOptions: number[] = [
  15 * 60,
  30 * 60,
  60 * 60,
  90 * 60,
  120 * 60,
];
