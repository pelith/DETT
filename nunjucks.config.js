const canonicalUrl = 'https://dett.cc'

module.exports = {
  root: './src',
  data: {
    showTopbar: true,
    title: 'LOOM BBS',
    description: '基於 LOOM 智慧合約的 BBS 系統' ,
    canonicalUrl,
  },
  filters: {
    prefixUrl: path => path ? `${canonicalUrl}/${path}` : `${canonicalUrl}`
  },
}
