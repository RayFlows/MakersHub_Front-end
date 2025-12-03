const formatDateTime = isoString => {
  if (!isoString) return '';

  const date = new Date(isoString);
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return isoString; // 返回原始字符串
  }
  
  // 格式化为 YYYY/MM/DD HH:MM
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${year}/${month}/${day} ${hours}:${minutes}`;
};

/**
 * 将时间组件转换为ISO 8601格式的时间字符串
 * @param {Object} options - 时间组件对象
 * @param {string|number} options.year - 年份
 * @param {string|number} options.month - 月份（可包含"月"字）
 * @param {string|number} options.day - 日期（可包含"日"字）
 * @param {string|number} options.hour - 小时（可包含"时"字）
 * @param {string|number} options.minute - 分钟（可包含"分"字）
 * @returns {string} ISO格式的时间字符串，格式为YYYY-MM-DDThh:mm:00Z
 */
const formatToISOTime = (options) => {
  // 检查必要参数
  if (!options || !options.year || !options.month || !options.day || 
      !options.hour || !options.minute) {
    return '';
  }
  
  // 提取数字并格式化为两位
  const extractNumber = (value) => {
    if (!value) return '00';
    return value.toString().replace(/[^0-9]/g, '').padStart(2, '0');
  };
  
  try {
    const year = options.year.toString().replace(/[^0-9]/g, '');
    const month = extractNumber(options.month);
    const day = extractNumber(options.day);
    const hour = extractNumber(options.hour);
    const minute = extractNumber(options.minute);
    
    // 验证提取的值是否合法
    if (!year || !month || !day || !hour || !minute) {
      return '';
    }
    
    // 构建并返回ISO格式时间
    return `${year}-${month}-${day}T${hour}:${minute}:00Z`;
  } catch (error) {
    console.error('格式化时间错误:', error);
    return '';
  }
};

module.exports = {
  formatDateTime: formatDateTime,
  formatToISOTime: formatToISOTime
}

