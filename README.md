# 逻辑解谜

## [数独](https://cn.puzzle-sudoku.com/)

数独求解，说白了，就是要找出每个单元格的**唯一余数**。

基于**等位群格位**做排除法，能够快速得到部分单元格的唯一数，而对于存在多个候选数的**多值格**，则需要**试数**才能在候选数中筛选出正确的解。

## [数织](https://cn.puzzle-nonograms.com/)

数织求解，有一个难点问题是：如何判断盘面的填充是正确的？

### v0.候选数法

这个思路其实是受到了求解数独的影响，候选数其实就是各行各列符合条件的填充组合，把一格一格的填充放大成为一行一列的填充，这样也可以省略对盘面填充的校验。

候选数，对于数独来说，至多也就是九选一，但是对于数织来说，就可能是千选一、万选一，甚至是百万、千万中选一个。盘面越大，需要存储的冗余候选数就越多，最终导致内存溢出，盘面上限大概在 `40*40`。

### v1.穷举法

候选数法受限于外部资源，天花板比较低，无奈还是要重新拾起盘面填充校验。

穷举法虽然可以突破候选数法的上限，但也不过是以时间换空间，求解大盘面需要的时间还是太多了。

### v2.OX测试法

穷则思变，在某个时刻灵光闪现，经过验证之后，也不知道该说是之前想得太多还是想得太少，反正就是走了弯路。

其实对于数织来说，每个单元格非黑即白，都只是二选一而已。

在这个实现思路的基础上，对正则匹配做了一些调整，提高了整体的校验效率，大部分盘面的求解时间都是以秒或毫秒计，只有极少数盘面以分计。

_2022.3.28 支持彩色。_