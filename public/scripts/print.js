const printWindow = (username) => {
    w = window.open(`../${username}-favorites.txt`);
    w.focus();
    // adding brief timeout to make print dialog work in firefox as well
    setTimeout(() => {
        w.print();
    }, 100); 
}