$(document).ready(function(){
	//$('nav').prependTo('body');
	$('.card[data-id]').bind('click',function(){
		$('nav.cbp-spmenu').addClass('cbp-spmenu-open');
		//window.location.href=hv;
	});
	$('button.btn-close').click(function(e){
		e.preventDefault();
		$(this).parents('nav.cbp-spmenu').removeClass('cbp-spmenu-open');
	});
	$('[data-arhref]').bind('click',function(){
		var hv = $(this).data('arhref');
		window.location.href=hv;
	});
});